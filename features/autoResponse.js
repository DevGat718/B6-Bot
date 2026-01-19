const autoResponses = {
    'price': 'Our membership price is $50/month.',
    'location': 'We are located at 123 B6 Rider Lane.',
    'hours': 'We are open 9 AM - 5 PM, Mon-Fri.',
    'website': 'Visit us at www.b6riders.com'
};

const handleAutoResponse = async (client, msg) => {
    const messageBody = msg.body.toLowerCase();

    // Simple keyword matching
    for (const [keyword, response] of Object.entries(autoResponses)) {
        if (messageBody.includes(keyword)) {
            await msg.reply(response, null, { sendSeen: false });
            return; // Respond to the first match only
        }
    }
    
    // Optional: Default response or AI integration here
};

module.exports = {
    handleAutoResponse
};
