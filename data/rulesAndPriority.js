module.exports = {
    rules: [
        {
            topic: 'Pass Selection',
            keywords: ['select', 'pick', 'choose', 'expiration', 'valid', 'last minute'],
            content: '🎫 **Pass Selection**:\n• Choose a pass number and check the expiration date.\n• Only select if you plan to travel in the **next 6 months**.\n• For last-minute requests, contact the Admin in the chat!'
        },
        {
            topic: 'Pass Limits & Reset',
            keywords: ['limit', 'reset', 'how many', 'quota', 'april', 'october', 'june', 'december'],
            content: '📉 **Pass Limits**:\n• Riders choose **1-2 passes** every 6 months (June & December), depending on status.\n• **Reset**: Counts reset every **April & October**.\n• Unused/unplanned passes are withdrawn by the admin upon reset.'
        },
        {
            topic: 'Usage & Trading',
            keywords: ['use', 'trade', 'sell', 'group', 'transfer', 'gift', 'grabs'],
            content: '🤝 **Usage & Trading**:\n• Passes are for **"B6 Rider" group members only**.\n• Passes can be traded or put up for grabs (Max price: **$35**).\n• **Up for Grabs**: Tickets must be posted 30 days before expiration.\n• **Redemption**: All passes are eligible for redemption by any rider 30 days out from expiration.\n• To gift outside the group, send a private note to the Admin.'
        },
        {
            topic: 'Raffles',
            keywords: ['raffle', 'random', 'win', 'prize'],
            content: '🎟️ **Raffles**:\n• One random buddy pass will be raffled amongst all pass riders periodically.\n• Pop-up raffles may happen for unused passes!'
        },
        {
            topic: 'Costs & Fees',
            keywords: ['cost', 'price', 'fee', 'tax', 'bitcoin', 'crypto', 'pay'],
            content: '💸 **Pass Rider Costs (Taxes & Fees)**:\n\n🇺🇸 **Domestic (USA)**:\n• $80 - $160 (Includes $40-$60 service fee)\n\n🌍 **International**:\n• $150 - $350 (Includes $40-$60 service fee)\n\n💳 **Payment Methods**:\nUSD, Bitcoin, Ethereum, Polygon, USDC.\n\n*All Passes are Subject To Service Fees.*'
        },
        {
            topic: 'General Info',
            keywords: ['standby', 'website', 'seat', 'check', 'jetblue'],
            content: 'ℹ️ **General Info**:\n• All flights are **STANDBY** on JetBlue Airways (B6) only.\n• Check destinations at [www.jetblue.com](https://www.jetblue.com).\n• Text in the chat if you need a seat availability check.'
        }
    ],
    priorityList: [
        {
            code: 'S6.STND1',
            name: 'Standard Riders',
            description: 'Eligible for [1] buddy pass every 6 months.'
        },
        {
            code: 'S6.PRM2',
            name: 'Premium Riders',
            description: 'Eligible for [2] buddy passes every 6 months.'
        },
        {
            code: 'S6+',
            name: 'Additional',
            description: 'Eligible for [1] buddy pass every 12 months.'
        },
        {
            code: 'RG - S6+',
            name: 'Registered Guest',
            description: 'Unlimited rides on CM benefits.'
        },
        {
            code: 'CLI+',
            name: 'Partnership / Clients',
            description: 'Allocated # of passes as part of group contract/terms.'
        }
    ],
    riderRoster: {
        current: [
            '1. Malcolm M. (Companion S5) / S6+ (1 yearly)',
            '2. Gilly A. / S6.STND1',
            '3. Lakim D. / RG - S6+',
            '4. Jiggy M. / S6.PRM2',
            '5. Rontez V. / S6.STND1',
            '6. Simone S. / S6.STND1',
            '7. Ryan (uncle) / S6.PRM2',
            '8. Lauren (sister) / S6.PRM2',
            '9. Darius B. / CLI+',
            '10. Carl S. / S6.STND1',
            '11. Sena H. / S6.STND1',
            '12. Jaime H. (cousin) / RG - S6+',
            '13. Molly O. / S6.STND1',
            '14. Pedro V. / S6.STND1',
            '15. Brady V. / S6.STND1',
            '16. Lionel T. / S6.STND1',
            '17. Sena H. / S6.STND1',
            '18. Karen E. / S6.STND1',
            '19. Jimmy T. / S6.PRM2',
            '20. Ashley W. (cousin) / S6.PRM2'
        ],
        unlisted: [
            '1. Kim B. (sister unlisted) / S6.PRM2',
            '2. Wendy T. (aunt unlisted) / S6+ (1 yearly)',
            '3. Daisean R. / S6.PRM2',
            '4. Kayvon R. / S6.PRM2',
            '5. Tad W. / S6.PRM2',
            '6. Tad W. / S6.PRM2',
            '7. Steve O. / S6.STND1',
            '8. Thifa T. / S6.STND1'
        ],
        dmgGroup: [
            '* Jiggy M. / S6.PRM2',
            '* Brady V. / S6+ (on request)',
            '* Bryan C. / S6+ (on request)',
            '* Chris S. / S6+ (on request)',
            '* Domo W. / S6+ (on request)',
            '* Molly O. / S6.STND1',
            '* Keana T. / S6+ (on request)'
        ]
    }
};
