# 🛠️ Troubleshooting & Known Issues Registry

This document serves as an active record of known errors, their causes, and the implemented fixes. **Always check this registry before debugging new issues.**

## 🚨 Critical: `markedUnread` Crash (WhatsApp Web Update)

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'markedUnread')
at window.WWebJS.sendSeen ...
```

**Cause:**
A breaking update in WhatsApp Web (around April 2024) changed the internal DOM structure, causing the `sendSeen` function (which triggers blue ticks) to crash the library.

**Fix (Implemented):**
We must **globally disable** the `sendSeen` feature in all message sending operations.

**Action Required:**
Every time `sendMessage` or `msg.reply` is used, you **MUST** pass the option `{ sendSeen: false }`.

**Code Example:**
```javascript
// ✅ CORRECT
await client.sendMessage(chatId, 'Hello', { sendSeen: false });
await msg.reply('Hello', null, { sendSeen: false });

// ❌ WRONG (Will Crash)
await client.sendMessage(chatId, 'Hello');
await msg.reply('Hello');
```

---

## 🔑 Authentication: `LocalAuth` vs `NoAuth`

**Issue:**
Bot requires frequent QR scanning or fails to save session state.

**Solution:**
- Use `LocalAuth` to save session files locally (`.wwebjs_auth`).
- **Cloud Deployment:** Ensure the cloud provider supports persistent storage (Volumes) for the `.wwebjs_auth` folder, or you will need to scan on every restart.

---

## 🤖 Bot Self-Reply Loop

**Issue:**
Bot replies to itself infinitely (e.g., responding to its own prompts).

**Solution:**
The `index.js` message handler includes specific logic to ignore messages where `msg.fromMe === true`, UNLESS they are specific commands initiated by the Admin.

**Code Reference:**
See `client.on('message_create', ...)` in `index.js`.

---

## 🔁 Duplicate Bot Responses

**Issue:**
The bot replies 2+ times to a single command (e.g., sending the Menu twice).

**Cause:**
Network latency or library events firing multiple times for the same message ID can trigger the handler repeatedly.

**Fix (Implemented):**
Added a **Message De-duplication Cache** in `index.js`.
1. We store processed `msg.id._serialized` in a `Set`.
2. If an ID exists in the Set, we ignore it.
3. The Set is cleared periodically to save memory.

**Code Reference:**
```javascript
const processedMessages = new Set();
client.on('message_create', async msg => {
    if (processedMessages.has(msg.id._serialized)) return;
    processedMessages.add(msg.id._serialized);
    // ... rest of logic
});
```

---

## 🧭 Menu Flow & "Stuck" States

**Issue:**
Users were getting multiple responses for one selection, or getting stuck in a menu (e.g., "Rule Selection") with no way out.

**Fix (Implemented):**
1. **Explicit Returns**: Added `return` statements after handling each menu option in `questionHandler.js` to prevent "fall-through" logic (where it would execute option 2 AND the error message).
2. **Loop Prevention**: In `STEPS.RULE_SELECTION`, we now allow the user to select another rule immediately without deleting their session state.
3. **Navigation Commands**: Added support for `0`, `menu`, or `back` to return to the main menu from sub-menus.
4. **Multi-Select**: Users can now type `1,3` to get multiple pieces of info at once.

**Code Reference:**
See `features/questionHandler.js`.

---

## 🧟 Zombie Chrome Processes

**Issue:**
`Error: The browser is already running...` when trying to restart the bot.

**Cause:**
When the bot script stops (or crashes), the background Chrome/Puppeteer process sometimes doesn't close, locking the session file.

**Fix (Implemented):**
Always run a cleanup command before starting:
`pkill -f "node index.js" || true && pkill -f "chrome" || true`

**Tip:**
If the bot won't start, kill the terminal and run the cleanup command manually.

---

## ☁️ Cloud Deployment: Invalid QR Code in Logs

**Issue:**
When deploying to cloud platforms (like Railway, Heroku, etc.), the QR code printed in the terminal logs appears broken, wrapped, or corrupted, making it impossible to scan with the WhatsApp app.

**Cause:**
Cloud terminal logs often handle ASCII characters and line breaks differently than local terminals, distorting the large QR code block.

**Fix (Implemented):**
We added a minimal **Express Web Server** to the bot (`index.js`).

1. **How it works:** The bot now listens on a web port (e.g., 3000) and serves a simple HTML page.
2. **How to connect:**
   - Deploy the bot.
   - Open the **Public Domain** provided by your cloud host (e.g., `https://your-bot.up.railway.app`).
   - The QR code will be displayed clearly on the webpage.
   - Scan it to login.

**Code Reference:**
See the `app.get('/', ...)` section in `index.js`.
