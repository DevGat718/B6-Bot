const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const { handleFlightInquiry, isUserInFlightFlow, BOT_PROMPTS } = require('./features/flightInquiry');
const { handleQuestion, isUserInQuestionFlow } = require('./features/questionHandler');
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
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
    console.log('Please scan the QR code above with WhatsApp.');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('ready', async () => {
    console.log('Client is ready!');
    setupBroadcasts(client);

    // Notify Admin that bot is online (with a small delay to ensure connection is stable)
    if (config.ADMIN_NUMBER) {
        setTimeout(async () => {
            const adminId = config.ADMIN_NUMBER.includes('@') ? config.ADMIN_NUMBER : `${config.ADMIN_NUMBER}@c.us`;
            console.log(`Attempting to send startup message to: ${adminId}`);
            try {
                const msg = await client.sendMessage(adminId, '🤖 B6 Bot is now online and connected!');
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
                
                await group.sendMessage(startupMsg);
                console.log(`✅ Startup message sent to group: ${config.GROUP_NAME}`);
            } else {
                console.log(`⚠️ Could not find group: "${config.GROUP_NAME}"`);
            }
        } catch (err) {
            console.error('Error finding group:', err);
        }
    }, 7000);
});

// Use message_create to catch all messages, including those sent by the bot/user itself
client.on('message_create', async msg => {
    // Log for debugging
    console.log(`MSG: ${msg.body} | From: ${msg.from} | Author: ${msg.author} | FromMe: ${msg.fromMe}`);

    // IGNORE logic for self-messages (Bot Replies)
    // If it's from ME, we need to check if it's a command OR user input, 
    // but NOT the bot's own prompt messages.
    if (msg.fromMe) {
        // 1. Ignore if it matches known Bot Prompts (prevents infinite loops)
        if (BOT_PROMPTS.some(prompt => msg.body.includes(prompt))) {
            return;
        }
        if (msg.body.includes('🤖 B6 Bot is online')) return;
        if (msg.body === 'pong') return;
        if (msg.body.startsWith('New Flight Inquiry:')) return;
        
        // 2. Allow commands
        if (msg.body.toLowerCase().startsWith('!')) {
            // Process command below
        } 
        // 3. Allow Flow Input if user is in a flow
        else if (isUserInFlightFlow(msg.author || msg.from)) {
            // Process flow below
        }
        // 4. Otherwise ignore (don't auto-respond to random self-messages)
        else {
            return;
        }
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
        await msg.reply('pong');
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
