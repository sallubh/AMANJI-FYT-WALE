// autoseen.js
module.exports.config = {
  name: "autoseen",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Aman",
  description: "Automatically marks incoming messages as seen",
  commandCategory: "system",
  cooldowns: 0,
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event || !event.threadID) return;

    // Sirf new messages ke liye
    if (event.type === "message" || event.type === "message_reply") {
      await api.markAsRead(event.threadID);
      await api.markAsSeen(event.threadID);

      // Debug ke liye console log
      console.log(`[AutoSeen] Marked seen in thread: ${event.threadID}`);
    }
  } catch (err) {
    console.error("[AutoSeen Error]", err.message);
  }
};

module.exports.run = async function () {
  // ye command run ke liye nahi hai
  return;
};
