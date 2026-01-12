# B6 Riders WhatsApp Bot

This bot is designed for the "B6 Riders" WhatsApp group. It handles scheduled broadcasts, flight inquiries, and auto-responses.

## Features

1.  **Scheduled Broadcasts**: Automatically sends a daily update to the "B6 Riders" group (configurable in `features/broadcast.js` and `config.js`).
2.  **Flight Inquiries**: Collects member flight details via a conversational flow and sends a summary to the Admin.
    -   Trigger command: `!flight`
3.  **Auto Responses**: Responds to keywords like "price", "location", "hours", "website".

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configuration**:
    -   Copy `.env.example` to `.env`.
    -   Update `GROUP_NAME` with the exact name of your WhatsApp group.
    -   Update `ADMIN_NUMBER` with the phone number that should receive flight inquiry summaries (format: country code + number, e.g., `15551234567`).

3.  **Run the Bot**:
    ```bash
    node index.js
    ```

4.  **Authentication**:
    -   On the first run, a QR code will appear in the terminal.
    -   Scan it with your WhatsApp app (Linked Devices) to log in.

## Usage

-   **!ping**: Check if the bot is alive.
-   **!flight**: Start the flight inquiry process.
-   **Keywords**: Send messages containing "price", "location", etc., to see auto-responses.

## File Structure

-   `index.js`: Entry point, handles message routing.
-   `config.js`: Configuration loader.
-   `features/broadcast.js`: Scheduled messaging logic.
-   `features/flightInquiry.js`: State machine for flight forms.
-   `features/autoResponse.js`: Keyword-based auto-replies.
