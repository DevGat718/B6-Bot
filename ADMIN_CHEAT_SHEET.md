# 🛠️ B6 Bot - Admin Cheat Sheet

This guide helps you manage, configure, and troubleshoot your WhatsApp bot.

## 🚦 Quick Start
*   **Start the Bot**:
    ```bash
    node index.js
    ```
*   **Stop the Bot**: Press `Ctrl + C` in the terminal.
*   **Scan QR**: If asked, scan the QR code in the terminal with WhatsApp (Linked Devices).

---

## ⚙️ Configuration

### **1. Managing Broadcasts (Scheduled Messages)**
*   **File**: `config.js`
*   **Action**: Edit the `BROADCASTS` array.
*   **Format**:
    ```javascript
    {
        schedule: 'Minute Hour * * Day', // See Cron Reference below
        message: 'Your message here'
    }
    ```
*   **Cron Reference**:
    *   `0 9 * * *` = Every day at 9:00 AM
    *   `30 14 * * *` = Every day at 2:30 PM
    *   `0 18 * * 5` = Every Friday at 6:00 PM (5 = Friday)
    *   `0 10 * * 1` = Every Monday at 10:00 AM (1 = Monday)

### **2. Changing Group Name or Admin Number**
*   **File**: `.env`
*   **Variables**:
    *   `GROUP_NAME`: Must match the WhatsApp group name **exactly**.
    *   `ADMIN_NUMBER`: Your number with country code (e.g., `1917...`).

### **3. Editing Auto-Responses**
*   **File**: `features/autoResponse.js`
*   **Action**: Add or change key-value pairs in the `autoResponses` object.
    ```javascript
    const autoResponses = {
        'keyword': 'The bot response',
        'price': '$50/month',
    };
    ```

---

## 🧪 Testing & Usage
*   **Test on Yourself**: You can send `!flight` to the bot (or to yourself) to test the flow. The bot will respond to you.
*   **Group Check**: When the bot starts, it logs "Available Groups". Ensure "B6 Pass Riders" is listed there.

---

## ❓ Troubleshooting
*   **"Bot won't reply to me"**:
    *   Restart the bot (`Ctrl + C`, `node index.js`).
    *   Ensure you are using `!flight` exactly.
*   **"Group not found"**:
    *   Check `config.js` or `.env` for typos in `GROUP_NAME`.
    *   Ensure the bot is actually **IN** the group (added as a participant).
*   **"Browser already running" error**:
    *   Run this command in the terminal to kill stuck processes:
        ```bash
        pkill -f "Google Chrome" || pkill -f chrome
        ```
