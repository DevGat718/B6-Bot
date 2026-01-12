require('dotenv').config();

module.exports = {
    GROUP_NAME: process.env.GROUP_NAME || 'B6 Pass Riders',
    ADMIN_NUMBER: process.env.ADMIN_NUMBER,
    // List of broadcasts. Each object has a schedule (cron) and a message.
    BROADCASTS: [
        {
            schedule: '0 9 * * *', // 9:00 AM Daily
            message: 'Good morning B6 Pass Riders! ☀️\nHope everyone has safe travels today.'
        },
        {
            schedule: '0 18 * * 5', // 6:00 PM Fridays
            message: 'Happy Friday! ✈️\nPlanning a weekend trip? Check the loads!'
        }
    ]
};
