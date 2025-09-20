const axios = require('axios');

module.exports.config = {
    name: "keepalive-auto",
    eventType: ["log:unsubscribe", "log:subscribe"]
};

let lastPing = Date.now();
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes
const RENDER_URL = "https://ak-bot-8qqx.onrender.com"; // Your Render URL

module.exports.run = async function({ api, event }) {
    const now = Date.now();
    
    // Check if 4 minutes passed since last ping
    if (now - lastPing >= PING_INTERVAL) {
        try {
            await axios.get(RENDER_URL + '/ping', {
                timeout: 8000,
                headers: { 'User-Agent': 'AutoKeepAlive/1.0' }
            });
            
            console.log(`✅ [${new Date().toISOString()}] Auto keep-alive ping successful`);
            lastPing = now;
        } catch (error) {
            console.error(`❌ [${new Date().toISOString()}] Auto keep-alive ping failed:`, error.message);
            // Still update lastPing to avoid spam attempts
            lastPing = now;
        }
    }
};
