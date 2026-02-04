const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const QRCode = require('qrcode');
const config = require('./config');

// --- 1. Start Web Server IMMEDIATELY (Critical for Railway Health Check) ---
const app = express();
const port = process.env.PORT || 3000;

let qrCodeData = null; // Store the latest QR code string for the web view
let clientStatus = 'Initializing...';
let lastError = null;

app.get('/', async (req, res) => {
    let htmlContent = `
        <html>
            <head>
                <title>B6 Bot Status</title>
                <meta http-equiv="refresh" content="10">
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; flex-direction: column; }
                    .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 90%; }
                    .status { font-weight: bold; color: #333; margin-bottom: 10px; }
                    textarea { width: 100%; font-family: monospace; font-size: 10px; }
                    .error { color: red; background: #fee; padding: 10px; border-radius: 5px; margin-top: 10px; word-break: break-word; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>B6 Bot Dashboard</h1>
                    <div class="status">Status: ${clientStatus}</div>
    `;

    if (qrCodeData) {
        try {
            const url = await QRCode.toDataURL(qrCodeData);
            htmlContent += `
                <h2>Scan QR Code to Login</h2>
                <img src="${url}" alt="QR Code" style="width:250px;height:250px;"/>
                <p>Refresh page if code expires.</p>
                <hr/>
                <p style="font-size: 12px; color: #666;">Raw Code (copy this if image fails):</p>
                <textarea rows="6" readonly onclick="this.select()">${qrCodeData}</textarea>
            `;
        } catch (err) {
            htmlContent += `<p class="error">Error generating QR Image: ${err.message}</p>`;
        }
    } else if (clientStatus === 'Ready') {
         htmlContent += `<p>✅ Bot is connected and running!</p>`;
    }

    if (lastError) {
        htmlContent += `
            <div class="error">
                <strong>Last Error:</strong><br/>
                ${lastError}
            </div>
        `;
    }

    if (!config.ADMIN_NUMBER) {
        htmlContent += `
            <div class="error" style="background: #fff3cd; color: #856404;">
                <strong>⚠️ Warning:</strong> ADMIN_NUMBER is not set in Railway variables.<br/>
                You will NOT receive a startup message.
            </div>
        `;
    }

    htmlContent += `
                </div>
            </body>
        </html>
    `;
    res.send(htmlContent);
});

app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Web server running on port ${port}`);
});

// --- 2. Global Error Handlers (Prevent App Crash) ---
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
    lastError = err.toString();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection:', reason);
    lastError = reason.toString();
});


// --- 3. Bot Logic ---
const { handleFlightInquiry, isUserInFlightFlow, BOT_PROMPTS } = require('./features/flightInquiry');
const { handleQuestion, isUserInQuestionFlow, QUESTION_PROMPTS } = require('./features/questionHandler');
const { handleAutoResponse } = require('./features/autoResponse');
const { setupBroadcasts } = require('./features/broadcast');

// Debug Configuration
console.log('--- Configuration Debug ---');
console.log(`Group Name: ${config.GROUP_NAME}`);
console.log(`Admin Number: ${config.ADMIN_NUMBER ? config.ADMIN_NUMBER : 'NOT SET'}`);
if (!config.ADMIN_NUMBER) {
    console.error('⚠️ WARNING: ADMIN_NUMBER is missing. Flight inquiries will not be sent to anyone.');
    console.error('Please check your .env file.');
}
console.log('---------------------------');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-software-rasterizer'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
});

client.on('qr', (qr) => {
    qrCodeData = qr; 
    clientStatus = 'Waiting for QR Scan';
    console.log('QR RECEIVED');
    qrcodeTerminal.generate(qr, { small: true });
});


client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    clientStatus = 'Auth Failure: ' + msg;
    lastError = 'Auth Failure: ' + msg;
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
    clientStatus = `Loading: ${percent}% ${message || ''}`;
});

client.on('ready', async () => {
    console.log('Client is ready!');
    qrCodeData = null; 
    clientStatus = 'Ready';
    lastError = null;
    setupBroadcasts(client);

    // 1. Notify Admin
    if (config.ADMIN_NUMBER) {
        setTimeout(async () => {
            const adminId = config.ADMIN_NUMBER.includes('@') ? config.ADMIN_NUMBER : `${config.ADMIN_NUMBER}@c.us`;
            try {
                await client.sendMessage(adminId, '🤖 B6 Bot is now online and connected!', { sendSeen: false });
                console.log('✅ Startup message sent to Admin');
            } catch (err) {
                console.error('Failed to send startup message to Admin:', err);
                lastError = `Admin Msg Error: ${err.message}`;
            }
        }, 3000);
    }

    // 2. Notify Group
    setTimeout(async () => {
        try {
            const chats = await client.getChats();
            console.log('Available Groups:', chats.filter(c => c.isGroup).map(c => c.name));
            
            const group = chats.find(chat => chat.isGroup && chat.name.trim() === config.GROUP_NAME.trim());
            if (group) {
                const startupMsg = '🤖 *B6 Bot is Online!*\n\n' +
                                 'Here are the available commands:\n' +
                                 '✈️ *!flight* - Start a flight load inquiry\n' +
                                 '❓ *!question* - View Rider Rules, Priority List & Roster\n' +
                                 '🏓 *!ping* - Check if bot is active';
                
                await group.sendMessage(startupMsg, { sendSeen: false });
                console.log(`✅ Startup message sent to group: ${config.GROUP_NAME}`);
            } else {
                console.log(`⚠️ Could not find group: "${config.GROUP_NAME}"`);
                lastError = `Group "${config.GROUP_NAME}" not found. Check exact name.`;
            }
        } catch (err) {
            console.error('Error finding group:', err);
            lastError = `Group Error: ${err.message}`;
        }
    }, 6000);
});

const processedMessages = new Set();

// Use message_create to catch all messages, including those sent by the bot/user itself
client.on('message_create', async msg => {
    // Prevent handling the same message multiple times
    if (processedMessages.has(msg.id._serialized)) return;
    processedMessages.add(msg.id._serialized);
    
    // Clear cache periodically to prevent memory leaks
    if (processedMessages.size > 1000) {
        processedMessages.clear();
    }

    // Log for debugging
    console.log(`MSG: ${msg.body} | From: ${msg.from} | Author: ${msg.author} | FromMe: ${msg.fromMe}`);

    // IGNORE logic for self-messages (Bot Replies)
    // If it's from ME, we need to check if it's a command OR user input, 
    // but NOT the bot's own prompt messages.
    if (msg.fromMe) {
        // ALWAYS IGNORE ALL MESSAGES FROM SELF
        // This is the safest way to prevent loops.
        // We only allowed self-commands for testing, but it's causing production loops.
        return;
    }

    // Determine the user ID (Author in group, From in private)
    const userId = msg.author || msg.from;

    // 1. Check if user is in a specific flow
    if (isUserInFlightFlow(userId)) {
        await handleFlightInquiry(client, msg);
        return;
    }
    if (isUserInQuestionFlow(userId)) {
        await handleQuestion(client, msg);
        return;
    }

    // 2. Command handling
    if (msg.body.toLowerCase() === '!ping') {
        await msg.reply('pong', null, { sendSeen: false });
    } else if (msg.body.toLowerCase() === '!flight') {
        await handleFlightInquiry(client, msg); // Start the flow
    } else if (msg.body.toLowerCase().startsWith('!question')) {
        await handleQuestion(client, msg);
    } else {
        // 3. Auto Response (only if NOT from me)
        if (!msg.fromMe) {
            await handleAutoResponse(client, msg);
        }
    }
});

console.log('Initializing Client...');
client.initialize().catch(err => {
    console.error('Initialization error:', err);
    lastError = 'Init Error: ' + err.toString();
    clientStatus = 'Crashed during Init';
});
