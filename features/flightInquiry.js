const config = require('../config');

// In-memory state management for flight inquiries
// Structure: { 'user_id': { step: 0, data: {} } }
const userState = {};

const STEPS = {
    START: 0,
    NAME: 1,
    DATES: 2,
    ROUTE: 3,
    FLIGHTS: 4,
    CONFIRMATION: 5
};

const isUserInFlightFlow = (userId) => {
    return userState[userId] && userState[userId].step !== STEPS.START;
};

// Prompt messages to ignore if sent by bot/self
const BOT_PROMPTS = [
    'Welcome to the Flight Inquiry Service. Please enter your full name:',
    'Thanks! What are your travel dates?',
    'Got it. Where are you traveling from and to? (e.g., JFK to LAX)',
    'Noted. Do you have any specific flights in mind? (If none, just type "No" or "Any")',
    'Thank you! Your inquiry has been sent to the admin.'
];

const handleFlightInquiry = async (client, msg) => {
    // Use author if available (group chat), otherwise use from (private chat)
    const userId = msg.author || msg.from;
    
    if (!userState[userId]) {
        userState[userId] = { step: STEPS.START, data: {} };
    }

    const currentState = userState[userId];

    switch (currentState.step) {
        case STEPS.START:
            await msg.reply('Welcome to the Flight Inquiry Service. Please enter your full name:');
            currentState.step = STEPS.NAME;
            break;

        case STEPS.NAME:
            currentState.data.name = msg.body;
            await msg.reply('Thanks! What are your travel dates?');
            currentState.step = STEPS.DATES;
            break;

        case STEPS.DATES:
            currentState.data.dates = msg.body;
            await msg.reply('Got it. Where are you traveling from and to? (e.g., JFK to LAX)');
            currentState.step = STEPS.ROUTE;
            break;

        case STEPS.ROUTE:
            currentState.data.route = msg.body;
            await msg.reply('Noted. Do you have any specific flights in mind? (If none, just type "No" or "Any")');
            currentState.step = STEPS.FLIGHTS;
            break;

        case STEPS.FLIGHTS:
            currentState.data.flights = msg.body;
            
            // Format the final message
            const summary = `New Flight Inquiry:\n` +
                          `👤 Name: ${currentState.data.name}\n` +
                          `📅 Dates: ${currentState.data.dates}\n` +
                          `🛫 Route: ${currentState.data.route}\n` +
                          `✈️ Specific Flights: ${currentState.data.flights}`;
            
            await msg.reply(`Thank you! Your inquiry has been sent to the admin.\n\nSummary:\n${summary}`);
            
            // Send to Admin
            if (config.ADMIN_NUMBER) {
                // Ensure the number format is correct (suffix @c.us for contacts)
                const adminId = config.ADMIN_NUMBER.includes('@') ? config.ADMIN_NUMBER : `${config.ADMIN_NUMBER}@c.us`;
                await client.sendMessage(adminId, summary);
            } else {
                console.log('ADMIN_NUMBER not set in config, could not send inquiry.');
            }

            // Reset state
            delete userState[userId];
            break;
            
        default:
            delete userState[userId];
            break;
    }
};

module.exports = {
    handleFlightInquiry,
    isUserInFlightFlow,
    BOT_PROMPTS
};
