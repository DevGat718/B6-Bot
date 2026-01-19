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
            '3️⃣ **Rider Roster** (List of names & status)\n' +
            '4️⃣ **Standby Travel 101** (Guide to getting on the plane)\n\n' +
            'Reply with `1`, `2`, `3`, or `4` (or multiple like `1,3`).',
            null,
            { sendSeen: false }
        );
        return;
    }

    // Check if user is in a flow
    if (userState[userId] === STEPS.MENU_SELECTION) {
        console.log(`[Question Flow] User ${userId} selected: "${text}"`);

        // Split input by comma or space to support multiple selections
        // Filter out empty strings
        const tokens = text.split(/[,.\s]+/).filter(t => t.length > 0);
        let handled = false;
        
        // Helper to check if any token matches specific keywords or numbers
        const hasOption = (opts) => tokens.some(t => opts.includes(t.toLowerCase()));

        // Option 2: Priority Codes
        if (hasOption(['2', 'priority', 'code', 'codes'])) {
            await msg.reply(formatPriorityList(), null, { sendSeen: false });
            handled = true;
        }

        // Option 3: Rider Roster
        if (hasOption(['3', 'roster', 'list', 'name', 'names'])) {
            await msg.reply(formatRiderRoster(), null, { sendSeen: false });
            handled = true;
        }

        // Option 4: Standby 101
        if (hasOption(['4', 'standby', '101', 'guide'])) {
            const rule101 = rules.find(r => r.topic === 'Standby Travel 101');
            if (rule101) await msg.reply(rule101.content, null, { sendSeen: false });
            handled = true;
        }

        // Option 1: Rules Menu (This changes state, so check it last or handle it specifically)
        if (hasOption(['1', 'rule', 'rules'])) {
            await msg.reply(formatRulesMenu(), null, { sendSeen: false });
            userState[userId] = STEPS.RULE_SELECTION; // Wait for rule selection
            return; // Stay in flow
        }

        // If we handled at least one valid option but NOT option 1, we are done.
        if (handled) {
            // Append a footer to the last message or send a new one
            // Sending a new one is cleaner to ensure visibility
            await msg.reply(
                '🔄 **Need more info?**\n' +
                'Reply with `1`, `2`, `3`, or `4` to see other options, or type `!question` to restart.',
                null,
                { sendSeen: false }
            );
            
            // Keep the state active so they can reply with numbers immediately
            return;
        }

        // If NO valid options were found in tokens, try legacy full-text matching for rules
        // or show error.
        
        // CRITICAL FIX: If we are already in MENU_SELECTION and the user typed a specific rule keyword
        // (like "Dress Code"), we should handle it. 
        // BUT if they typed "1" (which is handled above), we shouldn't fall through here.
        // The check `if (hasOption(['1', ...]))` returns early, so we are good there.
        
        // Wait, if the user types "1", we enter RULE_SELECTION and return.
        // But what if they type "5"? It falls through to here.
        
        // Also, if they type "Dress Code", we want to handle it.
        const matchedRule = rules.find(r => 
            r.keywords.some(k => text.toLowerCase().includes(k))
        );

        if (matchedRule) {
            await msg.reply(matchedRule.content, null, { sendSeen: false });
            // Should we switch to RULE_SELECTION? Or just stay in MENU?
            // If we stay in MENU, they can ask for "2" next.
            // Let's keep them in MENU but remind them they can ask more.
            
             await msg.reply(
                '🔄 **Need more info?**\n' +
                'Reply with `1`, `2`, `3`, or `4` to see other options, or type `!question` to restart.',
                null,
                { sendSeen: false }
            );
            // handled = true; // effectively handled
        } else {
            // Ignore irrelevant inputs if they are just numbers not in range, or random text
            // But if it explicitly looks like an attempt, warn them.
            
            // If the user typed a number like '5' (out of range), we should tell them.
            const isNumber = !isNaN(parseInt(text));
            if (isNumber) {
                    await msg.reply('❌ Invalid option. Please reply with `1`, `2`, `3`, or `4`.', null, { sendSeen: false });
            } else {
                // If it's text and didn't match a rule, maybe they are just chatting?
                // If we are in a flow, we assume they are talking to the bot.
                // Let's assume valid intent but failed match.
                await msg.reply('❌ Invalid option. Please reply with `1`, `2`, `3`, or `4`.\nOr type a keyword like "Dress Code".', null, { sendSeen: false });
            }
        }
        return;
    }

    // Check if user is selecting a specific rule (Step 2)
    if (userState[userId] === STEPS.RULE_SELECTION) {
        // Handle explicit number selection for rules (1-6)
        // Also support "0" or "menu" to go back
        const selection = parseInt(text);
        let matchedRule;

        if (text.toLowerCase() === '0' || text.toLowerCase().includes('menu') || text.toLowerCase().includes('back')) {
             await msg.reply(
                '❓ **Rider Support**\n\n' +
                'What would you like to know?\n' +
                '1️⃣ **Rider Rules** (Dress code, trading, etc.)\n' +
                '2️⃣ **Priority Codes** (S6, S6.STND1 meanings)\n' +
                '3️⃣ **Rider Roster** (List of names & status)\n' +
                '4️⃣ **Standby Travel 101** (Guide to getting on the plane)\n\n' +
                'Reply with `1`, `2`, `3`, or `4` (or multiple like `1,3`).',
                null,
                { sendSeen: false }
            );
            userState[userId] = STEPS.MENU_SELECTION;
            return;
        }

        if (!isNaN(selection) && selection > 0 && selection <= rules.length) {
            // User replied with a number (1-6)
            matchedRule = rules[selection - 1];
        } else {
            // User replied with a keyword
            // Fix: Ensure we don't fuzzy match too broadly
            matchedRule = rules.find(r => 
                r.keywords.some(k => text.toLowerCase().includes(k))
            );
        }

        if (matchedRule) {
            await msg.reply(matchedRule.content, null, { sendSeen: false });
            // Don't delete state, allow them to continue.
            // But verify we aren't sending this multiple times.
            // (Cache in index.js handles network dups, but logic loop needs check)
            
            await msg.reply(
                '🔄 **Need more info?**\n' +
                'Reply with another rule number, or `0` to go back to the Main Menu.',
                null,
                { sendSeen: false }
            );
        } else {
            // IGNORE if it's likely conversational or a mistake.
            // Only reply if it's clearly an attempt at a number we don't have.
            if (!isNaN(parseInt(text))) {
                 await msg.reply(`❌ Invalid rule selection. Please reply with a number 1-${rules.length}, a keyword, or '0' to go back.`, null, { sendSeen: false });
            }
        }
        return;
    }

    // If they typed "!question something" directly
    if (text.toLowerCase().startsWith('!question ')) {
        const query = text.substring(10).trim().toLowerCase();
        
        // Check Priority
        if (query.includes('code') || query.includes('definition')) {
            await msg.reply(formatPriorityList(), null, { sendSeen: false });
            return;
        }

        // Check Roster
        if (query.includes('list') || query.includes('name') || query.includes('roster') || query.includes('priority')) {
            await msg.reply(formatRiderRoster(), null, { sendSeen: false });
            return;
        }

        // Check Rules
        const matchedRule = rules.find(r => 
            r.keywords.some(k => query.includes(k))
        );

        if (matchedRule) {
            await msg.reply(matchedRule.content, null, { sendSeen: false });
        } else {
            await msg.reply(`🤔 I couldn't find a specific rule for "${query}".\n\nTry:\n${formatRulesMenu()}`, null, { sendSeen: false });
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
