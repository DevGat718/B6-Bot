const { rules, priorityList, riderRoster } = require('../data/rulesAndPriority');

// In-memory state to track if a user is in the middle of a Q&A session
const userState = {};

const STEPS = {
    START: 0,
    MENU_SELECTION: 1,
    RULE_SELECTION: 2
};

// Prompts to ignore if sent by the bot
const QUESTION_PROMPTS = [
    '❓ **Rider Support**',
    'What would you like to know?',
    '📜 **Rider Rules Topics**',
    '📋 **Priority Codes Breakdown**',
    '✈️ **Rider Roster & Priority**',
    'Reply with the *number* or *keyword*'
];

const formatPriorityList = () => {
    let message = '📋 **Priority Codes Breakdown**:\n\n';
    priorityList.forEach(p => {
        message += `*${p.code}*: ${p.name}\n_${p.description}_\n\n`;
    });
    return message;
};

const formatRiderRoster = () => {
    let message = '✈️ **Rider Roster & Priority**:\n\n';
    
    if (riderRoster.current && riderRoster.current.length > 0) {
        message += '*Current Riders (17)*:\n';
        riderRoster.current.forEach(r => message += `${r}\n`);
        message += '\n';
    }

    if (riderRoster.unlisted && riderRoster.unlisted.length > 0) {
        message += '*Unlisted (8)*:\n';
        riderRoster.unlisted.forEach(r => message += `${r}\n`);
        message += '\n';
    }

    if (riderRoster.dmgGroup && riderRoster.dmgGroup.length > 0) {
        message += '*DMG Group (6)*:\n';
        riderRoster.dmgGroup.forEach(r => message += `${r}\n`);
    }

    return message;
};

const formatRulesMenu = () => {
    let message = '📜 **Rider Rules Topics**:\n';
    rules.forEach((r, index) => {
        message += `${index + 1}. ${r.topic}\n`;
    });
    message += '\nReply with the *number* or *keyword* (e.g., "Dress Code") to learn more.';
    return message;
};

const handleQuestion = async (client, msg) => {
    const userId = msg.author || msg.from;
    const text = msg.body.trim(); // Keep case for now, process later

    // Check if it's the start command
    if (text.toLowerCase() === '!question') {
        userState[userId] = STEPS.MENU_SELECTION;
        await msg.reply(
            '❓ **Rider Support**\n\n' +
            'What would you like to know?\n' +
            '1️⃣ **Rider Rules** (Dress code, trading, etc.)\n' +
            '2️⃣ **Priority Codes** (S6, S6.STND1 meanings)\n' +
            '3️⃣ **Rider Roster** (List of names & status)\n\n' +
            'Reply with `1`, `2`, or `3`.'
        );
        return;
    }

    // Check if user is in a flow
    if (userState[userId] === STEPS.MENU_SELECTION) {
        console.log(`[Question Flow] User ${userId} selected: "${text}"`);

        if (text === '1' || text.startsWith('1') || text.toLowerCase().includes('rule')) {
            await msg.reply(formatRulesMenu());
            userState[userId] = STEPS.RULE_SELECTION; // Wait for rule selection
            return;
        } else if (text === '2' || text.startsWith('2') || text.toLowerCase().includes('code')) {
            await msg.reply(formatPriorityList());
            delete userState[userId];
        } else if (text === '3' || text.startsWith('3') || text.toLowerCase().includes('roster') || text.toLowerCase().includes('name')) {
            await msg.reply(formatRiderRoster());
            delete userState[userId];
        } else {
            // Try to find a match in rules directly
            const matchedRule = rules.find(r => 
                r.keywords.some(k => text.toLowerCase().includes(k))
            );

            if (matchedRule) {
                await msg.reply(matchedRule.content);
                delete userState[userId];
            } else {
                await msg.reply('❌ Invalid option. Please reply with `1`, `2`, or `3`.\nOr type a keyword like "Dress Code".');
            }
        }
        return;
    }

    // Check if user is selecting a specific rule (Step 2)
    if (userState[userId] === STEPS.RULE_SELECTION) {
        const selection = parseInt(text);
        let matchedRule;

        if (!isNaN(selection) && selection > 0 && selection <= rules.length) {
            // User replied with a number (1-6)
            matchedRule = rules[selection - 1];
        } else {
            // User replied with a keyword
            matchedRule = rules.find(r => 
                r.keywords.some(k => text.toLowerCase().includes(k))
            );
        }

        if (matchedRule) {
            await msg.reply(matchedRule.content);
            delete userState[userId];
        } else {
            await msg.reply(`❌ Invalid rule selection. Please reply with a number 1-${rules.length} or a keyword.`);
        }
        return;
    }

    // If they typed "!question something" directly
    if (text.toLowerCase().startsWith('!question ')) {
        const query = text.substring(10).trim().toLowerCase();
        
        // Check Priority
        if (query.includes('code') || query.includes('definition')) {
            await msg.reply(formatPriorityList());
            return;
        }

        // Check Roster
        if (query.includes('list') || query.includes('name') || query.includes('roster') || query.includes('priority')) {
            await msg.reply(formatRiderRoster());
            return;
        }

        // Check Rules
        const matchedRule = rules.find(r => 
            r.keywords.some(k => query.includes(k))
        );

        if (matchedRule) {
            await msg.reply(matchedRule.content);
        } else {
            await msg.reply(`🤔 I couldn't find a specific rule for "${query}".\n\nTry:\n${formatRulesMenu()}`);
        }
    }
};

const isUserInQuestionFlow = (userId) => {
    return userState[userId] !== undefined;
};

module.exports = {
    handleQuestion,
    isUserInQuestionFlow,
    QUESTION_PROMPTS
};
