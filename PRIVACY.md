# 🔐 Privacy Policy

This document outlines what data the Redline Client stores, how it is used, and your privacy rights as a user.

Effective date: July 12, 2025  
Last updated: August 4, 2025

## 📁 What Data Is Collected

The Redline Client stores the following types of data locally on your machine:

1. OAuth2 Tokens and User Information:
   - Used to authenticate and identify you with external services.

2. Usage Metrics:
   - Time spent in the client;
   - Time spent in-game.

3. (Optional) Discord Bot Linking:
   - Discord User ID;
   - The linking date;
   - In-game account id and shortId.

## 🌐 Where Your Data Is Stored
* Local Storage:
Most data (OAuth2 tokens, usage metrics) is stored locally on your device in the Electron-managed data folder:
- On Windows: `%APPDATA%/redline-client`
- On macOS: `~/Library/Application Support/redline-client`
- On Linux: `~/.config/redline-client`

* Server Storage:
If the user uses the Discord bot to authenticate, the collected data is securely stored on our server and used solely for account linking and verification.

## 🧠 Who Can Access Your Data
* Local Data:  
Only the application running on your device has access. It is never shared or uploaded without your action.
* Server Data:  
Discord and in-game related data is accessed only by our backend systems for linking and account management purposes.
A restricted API endpoint exists that allows authorized systems or personnel to retrieve certain user information (such as in-game short ID and the linking date) for administrative and support purposes.
This data is not shared with third parties.