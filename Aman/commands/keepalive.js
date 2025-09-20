const axios = require('axios');

module.exports.config = {
    name: "keepalive",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "Aman Khan",
    description: "Render server ko awake rakhta hai",
    commandCategory: "System",
    usages: "keepalive [on/off/status]",
    cooldowns: 5
};

let keepAliveInterval = null;
const RENDER_URL = "https://ak-bot-8qqx.onrender.com";

async function pingServer() {
    try {
        const response = await axios.get(RENDER_URL + "/ping", {
            timeout: 10000,
            headers: { 'User-Agent': 'Mirai-KeepAlive/1.0' }
        });
        
        console.log(`✅ Keep-alive ping successful: ${response.status}`);
        return true;
    } catch (error) {
        console.error(`❌ Keep-alive ping failed:`, error.message);
        return false;
    }
}

function startKeepAlive() {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    
    keepAliveInterval = setInterval(async () => {
        await pingServer();
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log("🚀 Keep-alive started");
    setTimeout(() => pingServer(), 5000);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        return true;
    }
    return false;
}

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const action = args[0] ? args[0].toLowerCase() : 'status';
    
    switch (action) {
        case 'on':
            startKeepAlive();
            api.sendMessage("✅ Keep-Alive Started!\n5-minute intervals", threadID);
            break;
            
        case 'off':
            const stopped = stopKeepAlive();
            api.sendMessage(stopped ? "⏹️ Keep-Alive Stopped!" : "⚠️ Was not running!", threadID);
            break;
            
        case 'test':
            const success = await pingServer();
            api.sendMessage(success ? "✅ Ping successful!" : "❌ Ping failed!", threadID);
            break;
            
        default:
            const isRunning = keepAliveInterval !== null;
            api.sendMessage(
                `📊 Keep-Alive Status: ${isRunning ? '✅ Running' : '❌ Stopped'}\n\n` +
                `Commands:\n/keepalive on\n/keepalive off\n/keepalive test`,
                threadID
            );
    }
};

module.exports.config = {
    name: "keepalive-event",
    eventType: ["log:unsubscribe", "log:subscribe"]
};

let lastPing = Date.now();
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes
const RENDER_URL = "https://ak-bot-8qqx.onrender.com"; // CHANGE THIS

module.exports.run = async function({ api, event }) {
    const now = Date.now();
    
    if (now - lastPing >= PING_INTERVAL) {
        try {
            const axios = require('axios');
            await axios.get(RENDER_URL + '/ping');
            console.log('✅ Auto keep-alive ping');
            lastPing = now;
        } catch (error) {
            console.error('❌ Auto ping failed:', error.message);
        }
    }
};
