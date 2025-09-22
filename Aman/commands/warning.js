module.exports.config = {
    name: "warning",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Aman Khan",
    description: "Auto warning system for bad words against bot",
    commandCategory: "noprefix",
    usages: "Auto trigger when someone abuses bot",
    cooldowns: 0
};

module.exports.handleEvent = async function({ api, event, Users }) {
    const { threadID, messageID, senderID, body } = event;
    
    // Skip if no message body
    if (!body) return;
    
    // Trigger words array (case insensitive)
    const triggerWords = [
        "bot chutiya hai",
        "bot baklol hai",
        "bot pagal hai",
        "bot bewakoof hai",
        "chutiya bot",
        "baklol bot",
        "pagal bot",
        "bewakoof bot",
        "bot stupid hai",
        "stupid bot",
        "bot faltu hai",
        "faltu bot"
    ];
    
    // Convert message to lowercase for checking
    const messageText = body.toLowerCase().trim();
    
    // Check if message contains any trigger word
    const hasTriggerWord = triggerWords.some(word => messageText.includes(word));
    
    if (hasTriggerWord) {
        try {
            // Add ❌ reaction to the offensive message
            await api.setMessageReaction("❌", messageID, (err) => {
                if (err) console.log("Reaction error:", err);
            }, true);
            
            // Get user name for mention
            const userName = await Users.getNameUser(senderID) || "User";
            
            // Warning message with strong response
            const warningMessage = `@${userName} tune gali kaise diya? 😡\nTu hota kon hai gali dene wala!\n\n⚠️ WARNING: Bot ko respect karo!\n🚫 Gali galoch allowed nahi hai!\n\n👋 Bye bye... apne paas rakho apna group!`;
            
            // Send warning message with user mention
            await api.sendMessage({
                body: warningMessage,
                mentions: [{
                    tag: `@${userName}`,
                    id: senderID
                }]
            }, threadID);
            
            // Wait 3 seconds before final message and leaving
            setTimeout(async () => {
                try {
                    // Send final goodbye message
                    await api.sendMessage("Apne paas rakho apna group! 🚪👋", threadID);
                    
                    // Wait 1 more second then leave the group
                    setTimeout(async () => {
                        try {
                            await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
                        } catch (leaveError) {
                            console.log("Error leaving group:", leaveError);
                        }
                    }, 1000);
                    
                } catch (finalError) {
                    console.log("Final message error:", finalError);
                }
            }, 3000);
            
        } catch (error) {
            console.log("Warning command error:", error);
        }
    }
};

module.exports.run = async function({ api, event }) {
    const helpMessage = `⚠️ WARNING SYSTEM ACTIVE! 🤖\n\n✅ Bot protection enabled\n🚫 Gali galoch not allowed\n❌ Auto reaction on bad words\n👋 Bot will leave if abused\n\n💡 Bot ko respect karo!`;
    
    return api.sendMessage(helpMessage, event.threadID, event.messageID);
};
