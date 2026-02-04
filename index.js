const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const QRCode = require('qrcode');
const config = require('./config');

const app = express();
const port = process.env.PORT || 3000;

let qrCodeData = null; // Store the latest QR code string for the web view

const { handleFlightInquiry, isUserInFlightFlow, BOT_PROMPTS } = require('./features/flightInquiry');
const { handleQuestion, isUserInQuestionFlow, QUESTION_PROMPTS } = require('./features/questionHandler');
const { handleAutoResponse } = require('./features/autoResponse');
const { setupBroadcasts } = require('./features/broadcast');

// --- Web Server for QR Code Display (Railway Support) ---
app.get('/', async (req, res) => {
    if (qrCodeData) {
        try {
            const url = await QRCode.toDataURL(qrCodeData);
            res.send(`
                <html>
                    <head>
                        <title>B6 Bot QR Code</title>
                        <meta http-equiv="refresh" content="20">
                    </head>
                    <body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;background-color:#f0f2f5;">
                        <div style="background:white;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);text-align:center;">
                            <h1>Scan QR Code to Login</h1>
                            <img src="${url}" alt="QR Code" style="width:300px;height:300px;"/>
                            <p>Refresh page if code expires.</p>
                            <hr/>
                            <p style="font-size: 12px; color: #666;">Raw Code (if image fails): <br/> <textarea rows="4" cols="50">${qrCodeData}</textarea></p>
                        </div>
                    </body>
                </html>
            `);
        } catch (err) {
            res.status(500).send('Error generating QR code');
        }
    } else {
        res.send(`
            <html>
                <head><title>B6 Bot Status</title></head>
                <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background-color:#f0f2f5;">
                     <div style="background:white;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);text-align:center;">
                        <h1>Bot is Online / Connected</h1>
                        <p>If you see this, the bot is running.</p>
                    </div>
                </body>
            </html>
        `);
    }
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Web server running on port ${port}`);
});

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
    qrCodeData = qr; // Update web view variable
    console.log('QR RECEIVED', qr);
    console.log('--- If the QR code below is not scanning ---');
    console.log('1. Open your app URL (e.g., https://your-app.up.railway.app)');
    console.log('2. Or copy the long string above starting with "2@" and use a generator');
    console.log('3. RAW QR DATA START');
    console.log(qr);
    console.log('RAW QR DATA END');
    console.log('--------------------------------------------');
    qrcodeTerminal.generate(qr, { small: true });
});


client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('ready', async () => {
    console.log('Client is ready!');
    qrCodeData = null; // Clear QR code when connected
    setupBroadcasts(client);

    // Notify Admin that bot is online (with a small delay to ensure connection is stable)
    if (config.ADMIN_NUMBER) {
        setTimeout(async () => {
            const adminId = config.ADMIN_NUMBER.includes('@') ? config.ADMIN_NUMBER : `${config.ADMIN_NUMBER}@c.us`;
            console.log(`Attempting to send startup message to: ${adminId}`);
            try {
                const msg = await client.sendMessage(adminId, '🤖 B6 Bot is now online and connected!', { sendSeen: false });
                console.log(`✅ Startup message sent to admin. Message ID: ${msg.id._serialized}`);
            } catch (err) {
                console.error('❌ Failed to send startup message to admin:', err);
            }
        }, 5000); // 5 second delay
    }

    // Also try to say hello to the group
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
            }
        } catch (err) {
            console.error('Error finding group:', err);
        }
    }, 7000);
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

client.initialize().catch(err => console.error('Initialization error:', err));
