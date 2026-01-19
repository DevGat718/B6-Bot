const schedule = require('node-schedule');
const config = require('../config');

const setupBroadcasts = (client) => {
    console.log('Setting up broadcast schedules...');
    
    // Check if BROADCASTS array exists and is valid
    if (!config.BROADCASTS || !Array.isArray(config.BROADCASTS)) {
        console.warn('⚠️ No broadcasts configured in config.js');
        return;
    }

    config.BROADCASTS.forEach((broadcast, index) => {
        if (!broadcast.schedule || !broadcast.message) {
            console.warn(`⚠️ Skipping invalid broadcast at index ${index}`);
            return;
        }

        console.log(`📅 Scheduling broadcast #${index + 1}: "${broadcast.message.substring(0, 20)}..." at ${broadcast.schedule}`);

        schedule.scheduleJob(broadcast.schedule, async () => {
            console.log(`Running scheduled broadcast #${index + 1}...`);
            try {
                const chats = await client.getChats();
                const group = chats.find(chat => chat.isGroup && chat.name.trim() === config.GROUP_NAME.trim());

                if (group) {
                    await group.sendMessage(broadcast.message, { sendSeen: false });
                    console.log(`✅ Broadcast sent to ${config.GROUP_NAME}`);
                } else {
                    console.log(`⚠️ Group "${config.GROUP_NAME}" not found. Could not send broadcast.`);
                }
            } catch (error) {
                console.error('❌ Error sending broadcast:', error);
            }
        });
    });
};

module.exports = {
    setupBroadcasts
};
