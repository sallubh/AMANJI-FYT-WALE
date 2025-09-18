const axios = require("axios");
const fs = require('fs');
const path = require('path');

// Simple file-based storage for autoseen settings
const dataFile = path.join(__dirname, 'autoseen_data.json');

// Helper function to read data
function readData() {
    try {
        if (fs.existsSync(dataFile)) {
            return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error("AutoSeen: Error reading data file", error);
        return {};
    }
}

// Helper function to write data
function writeData(data) {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("AutoSeen: Error writing data file", error);
        return false;
    }
}

module.exports.config = {
    name: "autoseen",
    version: "2.0.0",
    hasPermssion: 1, // Admin and higher can use
    credits: "Aman Khan", 
    description: "Thread ke liye autoseen on/off karo",
    commandCategory: "Admin",
    usages: "[on/off/status]",
    cooldowns: 3,
    dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID, isGroup } = event;
    
    try {
        // FIXED: Pehle check karte hain args exist karta hai ya nahi
        const input = (args && args[0]) ? args[0].toLowerCase() : '';
        
        // Show usage if no argument provided
        if (!input) {
            return api.sendMessage(
                "🔧 AutoSeen Commands:\n" +
                "• /autoseen on - Turn ON autoseen\n" +
                "• /autoseen off - Turn OFF autoseen\n" +
                "• /autoseen status - Check current status",
                threadID, messageID
            );
        }
        
        let data = readData();
        
        switch (input) {
            case 'on':
                data[threadID] = true;
                if (writeData(data)) {
                    api.sendMessage(
                        `✅ AutoSeen turned ON!\n${isGroup ? '👥 Group' : '👤 Chat'}: ${threadID}`,
                        threadID, messageID
                    );
                } else {
                    api.sendMessage("❌ Failed to save settings!", threadID, messageID);
                }
                break;
                
            case 'off':
                data[threadID] = false;
                if (writeData(data)) {
                    api.sendMessage(
                        `❌ AutoSeen turned OFF!\n${isGroup ? '👥 Group' : '👤 Chat'}: ${threadID}`,
                        threadID, messageID
                    );
                } else {
                    api.sendMessage("❌ Failed to save settings!", threadID, messageID);
                }
                break;
                
            case 'status':
                const isEnabled = data[threadID] === true;
                api.sendMessage(
                    `📊 AutoSeen Status:\n` +
                    `${isGroup ? '👥 Group' : '👤 Chat'}: ${threadID}\n` +
                    `Status: ${isEnabled ? '✅ ON' : '❌ OFF'}`,
                    threadID, messageID
                );
                break;
                
            default:
                api.sendMessage(
                    "❌ Invalid option!\nUse: on, off, or status",
                    threadID, messageID
                );
        }
        
    } catch (error) {
        console.error("AutoSeen Command Error:", error);
        api.sendMessage(
            "❌ Command failed! Check console for details.",
            threadID, messageID
        );
    }
};

// Auto seen functionality
module.exports.handleEvent = async function({ api, event }) {
    const { threadID, senderID, body, type } = event;
    
    // Only process message events
    if (type !== "message" && type !== "message_reply") {
        return;
    }
    
    // Skip bot's own messages
    if (senderID === api.getCurrentUserID()) {
        return;
    }
    
    // Skip commands - FIXED: Type check added
    if (body && typeof body === 'string' && (body.startsWith("/") || body.startsWith("!"))) {
        return;
    }
    
    try {
        const data = readData();
        
        // Check if autoseen is enabled for this thread
        if (data[threadID] === true) {
            // Add small delay to make it more natural
            setTimeout(() => {
                api.markAsRead(threadID, (err) => {
                    if (err) {
                        console.error(`AutoSeen: Failed to mark as read in ${threadID}:`, err.message);
                    }
                });
            }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
        }
        
    } catch (error) {
        console.error("AutoSeen Event Error:", error.message);
    }
};
