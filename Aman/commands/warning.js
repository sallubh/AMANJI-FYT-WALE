// warning.js
module.exports.config = {
    name: "warning",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "Aman Khan",
    description: "Auto warning system for bad words against bot",
    commandCategory: "noprefix",
    usages: "Auto trigger when someone abuses bot",
    cooldowns: 0
};

module.exports.handleEvent = async function({ api, event, Users }) {
    try {
        const { threadID, messageID, senderID, body } = event;

        // safety checks
        if (!body) return;
        const selfID = api.getCurrentUserID && api.getCurrentUserID();
        if (!senderID || senderID == selfID) return; // ignore bot's own messages

        // Trigger words array (lowercase)
        const triggerWords = [
            "bot chutiya",
            "bot chutiya hai",
            "bot baklol",
            "bot baklol hai",
            "bot pagal",
            "bot pagal hai",
            "bot bewakoof",
            "bot bewakoof hai",
            "chutiya bot",
            "baklol bot",
            "pagal bot",
            "bewakoof bot",
            "bot stupid",
            "stupid bot",
            "bot faltu",
            "faltu bot",
            "bot faltu hai"
        ];

        const messageText = body.toLowerCase().trim();

        // check contains any trigger (substring match)
        const hasTriggerWord = triggerWords.some(w => messageText.includes(w));

        if (!hasTriggerWord) return;

        // Reaction (best-effort)
        try {
            if (messageID) {
                // some libs use (emoji, messageID, cb, true)
                api.setMessageReaction && api.setMessageReaction("❌", messageID, () => {}, true);
            }
        } catch (e) {
            console.log("[warning] reaction error:", e.message || e);
        }

        // Get user's display name (best-effort)
        let userName = "User";
        try {
            if (Users && typeof Users.getNameUser === "function") {
                const name = await Users.getNameUser(senderID);
                if (name) userName = name;
            }
        } catch (e) {
            console.log("[warning] get user name error:", e.message || e);
        }

        // Build warning message. Body must contain the exact substring used in mentions.tag.
        const mentionTag = userName;
        const warningBody = `${mentionTag} tune gali kaise di? 😡\nTu hota kaun hai? Dafa ho tu yaha se!\n\n⚠️ Bot ko respect karo!`;

        // Send first warning with mention (fromIndex = position of tag in body)
        try {
            const mentions = [{
                tag: mentionTag,
                id: senderID,
                fromIndex: warningBody.indexOf(mentionTag) // typically 0
            }];

            await new Promise((resolve) => {
                api.sendMessage({ body: warningBody, mentions }, threadID, (err) => {
                    if (err) console.log("[warning] send mention error:", err);
                    resolve();
                });
            });
        } catch (e) {
            console.log("[warning] send mention exception:", e.message || e);
        }

        // After 3 seconds send final message then leave the group (best-effort)
        setTimeout(async () => {
            try {
                // Final message
                const finalMsg = "Apne paas rakho apna group! 🚪👋";
                await new Promise((resolve) => {
                    api.sendMessage(finalMsg, threadID, (err) => {
                        if (err) console.log("[warning] final msg error:", err);
                        resolve();
                    });
                });

                // Wait a bit then try to remove bot (leave)
                setTimeout(async () => {
                    try {
                        // Try callback-style remove in both common parameter orders
                        const myId = typeof api.getCurrentUserID === "function" ? api.getCurrentUserID() : null;

                        const tryRemove = () => new Promise((resolve) => {
                            try {
                                if (!myId) {
                                    // try leaveGroup if available
                                    if (typeof api.leaveGroup === "function") {
                                        api.leaveGroup(threadID, (err) => {
                                            if (err) console.log("[warning] leaveGroup err:", err);
                                            resolve();
                                        });
                                    } else resolve();
                                    return;
                                }

                                // attempt common signature: removeUserFromGroup(userID, threadID, cb)
                                api.removeUserFromGroup && api.removeUserFromGroup(myId, threadID, (err) => {
                                    if (!err) return resolve();
                                    // try reversed order: removeUserFromGroup(threadID, userID, cb)
                                    api.removeUserFromGroup(myId, threadID, (err2) => {
                                        // note: some libs insist the same order; we already tried. fallback to leaveGroup
                                        if (!err2) return resolve();
                                        if (typeof api.leaveGroup === "function") {
                                            api.leaveGroup(threadID, (err3) => { if (err3) console.log("[warning] leaveGroup err2:", err3); resolve(); });
                                        } else resolve();
                                    });
                                });
                            } catch (e) {
                                // fallback to leaveGroup
                                try {
                                    if (typeof api.leaveGroup === "function") {
                                        api.leaveGroup(threadID, (err) => { if (err) console.log("[warning] leaveGroup err3:", err); resolve(); });
                                    } else resolve();
                                } catch (ee) {
                                    console.log("[warning] remove error fallback:", ee.message || ee);
                                    resolve();
                                }
                            }
                        });

                        await tryRemove();
                    } catch (leaveErr) {
                        console.log("[warning] leaving error:", leaveErr.message || leaveErr);
                    }
                }, 1000);

            } catch (finalErr) {
                console.log("[warning] final step error:", finalErr.message || finalErr);
            }
        }, 3000);

    } catch (err) {
        console.log("[warning] handleEvent error:", err.message || err);
    }
};

module.exports.run = async function({ api, event }) {
    const helpMessage = `⚠️ WARNING SYSTEM ACTIVE! 🤖\n\n✅ Bot protection enabled\n🚫 Gali galoch not allowed\n❌ Auto reaction on bad words\n👋 Bot will leave if abused\n\n💡 Bot ko respect karo!`;
    return api.sendMessage(helpMessage, event.threadID, event.messageID);
};
