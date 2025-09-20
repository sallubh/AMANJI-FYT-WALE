require("dotenv").config();
const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, rm } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const login = require("fca-priyansh"); 
const axios = require("axios");

// ========= HTTP SERVER FOR RENDER KEEP-ALIVE =========
const express = require('express');
const app = express();

app.use(express.json());

app.get('/ping', (req, res) => {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    const timestamp = new Date().toISOString();
    
    res.status(200).json({
        status: 'alive',
        timestamp: timestamp,
        uptime: {
            seconds: Math.floor(uptime),
            minutes: Math.floor(uptime / 60),
            hours: Math.floor(uptime / 3600),
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        memory: {
            used: Math.round(memory.heapUsed / 1024 / 1024),
            total: Math.round(memory.heapTotal / 1024 / 1024),
            external: Math.round(memory.external / 1024 / 1024),
            formatted: `${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB`
        },
        bot: {
            name: 'AMAN BOT',
            version: global.config?.version || '1.2.14',
            commands: global.client?.commands?.size || 0,
            events: global.client?.events?.size || 0,
            startTime: global.client?.timeStart ? new Date(global.client.timeStart).toISOString() : null
        },
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid
        }
    });
    
    console.log(`[PING] Health check at ${timestamp} - Uptime: ${Math.floor(uptime / 60)}m`);
});

app.get('/', (req, res) => {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AMAN BOT Status</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; 
                    margin: 0; 
                    padding: 20px;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    max-width: 600px;
                    width: 100%;
                }
                h1 { 
                    text-align: center; 
                    margin-bottom: 30px;
                    font-size: 2.5em;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                .status-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .stat-card {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 15px;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .stat-title {
                    font-weight: bold;
                    font-size: 1.1em;
                    margin-bottom: 10px;
                    color: #FFD700;
                }
                .stat-value {
                    font-size: 1.3em;
                    margin-bottom: 5px;
                }
                .online-badge {
                    display: inline-block;
                    background: #00ff88;
                    color: #000;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .refresh-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    margin-top: 20px;
                    font-size: 1em;
                    transition: all 0.3s ease;
                }
                .refresh-btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="online-badge">🟢 ONLINE</div>
                <h1>🤖 AMAN BOT</h1>
                
                <div class="status-grid">
                    <div class="stat-card">
                        <div class="stat-title">⏱️ Uptime</div>
                        <div class="stat-value">${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-title">💾 Memory Usage</div>
                        <div class="stat-value">${Math.round(memory.heapUsed / 1024 / 1024)} MB</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-title">⚡ Commands</div>
                        <div class="stat-value">${global.client?.commands?.size || 0} loaded</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-title">🎯 Events</div>
                        <div class="stat-value">${global.client?.events?.size || 0} active</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <div style="margin-bottom: 15px;">
                        <strong>🚀 Bot Version:</strong> ${global.config?.version || '1.2.14'}<br>
                        <strong>🌐 Platform:</strong> ${process.platform}<br>
                        <strong>📅 Started:</strong> ${global.client?.timeStart ? new Date(global.client.timeStart).toLocaleString() : 'Unknown'}
                    </div>
                    
                    <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Status</button>
                </div>
            </div>
            
            <script>
                setTimeout(() => location.reload(), 30000);
            </script>
        </body>
        </html>
    `);
});

app.get('/status', (req, res) => {
    res.json({
        online: true,
        bot: 'AMAN BOT',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        commands: global.client?.commands?.size || 0,
        events: global.client?.events?.size || 0
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        endpoints: {
            '/': 'Bot status page',
            '/ping': 'Health check (main keep-alive endpoint)',
            '/status': 'JSON status',
            '/api/info': 'This endpoint info'
        },
        bot: 'AMAN BOT by Aman Khan',
        version: global.config?.version || '1.2.14'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: ['/', '/ping', '/status', '/api/info'],
        bot: 'AMAN BOT'
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/ping`);
    console.log(`📊 Status page: http://localhost:${PORT}/`);
});

server.on('error', (error) => {
    console.error('❌ HTTP Server error:', error.message);
});

// ========= END OF HTTP SERVER CODE =========

const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;
global.client = new Object({
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: new Array(),
    handleSchedule: new Array(),
    handleReaction: new Array(),
    handleReply: new Array(),
    mainPath: process.cwd(),
    configPath: new String(),
    timeStart: null,
    getTime: function (option) {
        switch (option) {
            case "seconds":
                return `${moment.tz("Asia/Kolkata").format("ss")}`;
            case "minutes":
                return `${moment.tz("Asia/Kolkata").format("mm")}`;
            case "hours":
                return `${moment.tz("Asia/Kolkata").format("HH")}`;
            case "date": 
                return `${moment.tz("Asia/Kolkata").format("DD")}`;
            case "month":
                return `${moment.tz("Asia/Kolkata").format("MM")}`;
            case "year":
                return `${moment.tz("Asia/Kolkata").format("YYYY")}`;
            case "fullHour":
                return `${moment.tz("Asia/Kolkata").format("HH:mm:ss")}`;
            case "fullYear":
                return `${moment.tz("Asia/Kolkata").format("DD/MM/YYYY")}`;
            case "fullTime":
                return `${moment.tz("Asia/Kolkata").format("HH:mm:ss DD/MM/YYYY")}`;
        }
    }
});

global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Array(),
    groupNameLock: new Map(),
    groupDpLock: new Map(),
    memberNameLock: new Map()
});

global.utils = require("./utils/index.js");
global.nodemodule = new Object();
global.config = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();

async function checkBan(api) {
    try {
        global.checkBan = true;
        return true;
    } catch (error) {
        global.checkBan = false;
        return false;
    }
}

//////////////////////////////////////////////////////////
//========= Find and get variable from Config =========//
/////////////////////////////////////////////////////////

var configValue;
try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    configValue = require(global.client.configPath);
    logger.loader("Found file config: config.json");
}
catch {
    if (existsSync(global.client.configPath.replace(/\.json/g,"") + ".temp")) {
        configValue = readFileSync(global.client.configPath.replace(/\.json/g,"") + ".temp");
        configValue = JSON.parse(configValue);
        logger.loader(`Found: ${global.client.configPath.replace(/\.json/g,"") + ".temp"}`);
    }
    else return logger.loader("config.json not found!", "error");
}

try {
    function injectEnv(obj, parentKey = "") {
        for (const key in obj) {
            const fullKey = (parentKey ? parentKey + "_" : "") + key;
            if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
                injectEnv(obj[key], fullKey);
            } else {
                const envKey = fullKey.toUpperCase();
                if (process.env[envKey]) {
                    obj[key] = process.env[envKey];
                }
            }
        }
    }
    injectEnv(configValue);

    if (!Array.isArray(configValue.commandDisabled)) configValue.commandDisabled = [];
    if (!Array.isArray(configValue.eventDisabled)) configValue.eventDisabled = [];

    for (const key in configValue) global.config[key] = configValue[key];
    logger.loader("Config Loaded with .env support!");
}
catch { return logger.loader("Can't load file config!", "error") }

let sequelize = null;
let Sequelize = null;
let databaseAvailable = false;

try {
    const dbModule = require("./includes/database/index.js");
    Sequelize = dbModule.Sequelize;
    sequelize = dbModule.sequelize;
    databaseAvailable = true;
    logger.loader("Database module loaded successfully");
} catch (dbError) {
    logger.loader(`Database module load error: ${dbError.message}`, "warn");
    logger.loader("Continuing without database support", "warn");
}

writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, { encoding: 'utf-8' })).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
    const getSeparator = item.indexOf('=');
    const itemKey = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1, item.length);
    const head = itemKey.slice(0, itemKey.indexOf('.'));
    const key = itemKey.replace(head + '.', '');
    const value = itemValue.replace(/\\n/gi, '\n');
    if (typeof global.language[head] == "undefined") global.language[head] = new Object();
    global.language[head][key] = value;
}

global.getText = function (...args) {
    const langText = global.language;    
    if (!langText.hasOwnProperty(args[0])) {
        console.warn(`Language key not found: ${args[0]}`);
        return `Missing language key: ${args[0]}.${args[1]}`;
    }
    var text = langText[args[0]][args[1]] || `Missing text: ${args[0]}.${args[1]}`;
    for (var i = args.length - 1; i > 0; i--) {
        const regEx = RegExp(`%${i}`, 'g');
        text = text.replace(regEx, args[i + 1]);
    }
    return text;
}

try {
    var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
    var appState = require(appStateFile);
    logger.loader(global.getText("priyansh", "foundPathAppstate") || "Found appstate file")
}
catch { 
    console.log("AppState file not found, but continuing...");
    var appState = [];
}
//========= Enhanced Bot Function with Database Safety =========//

function onBot({ models: botModel }) {
    const loginData = {};
    loginData['appState'] = appState;
    login(loginData, async(loginError, loginApiData) => {
        if (loginError) return logger(JSON.stringify(loginError), `ERROR`);
        
        if (global.config.FCAOption) {
            loginApiData.setOptions(global.config.FCAOption);
        }
        
        writeFileSync(appStateFile, JSON.stringify(loginApiData.getAppState(), null, '\x09'));
        
        global.client.api = loginApiData;
        global.api = loginApiData;
        
        console.log("[SYSTEM] ✅ Global API access enabled for commands");
        
        global.config.version = '1.2.14';
        
        global.client.timeStart = Date.now();
        console.log(`[SYSTEM] ✅ Bot start time set: ${new Date(global.client.timeStart).toISOString()}`);
        
        // Enhanced Commands Loading with Database Safety
        try {
            const commandsPath = join(global.client.mainPath, 'Aman', 'commands');
            if (existsSync(commandsPath)) {
                const listCommand = readdirSync(commandsPath).filter(command => 
                    command.endsWith('.js') && 
                    !command.includes('example') && 
                    !global.config.commandDisabled.includes(command)
                );
                
                for (const command of listCommand) {
                    try {
                        delete require.cache[require.resolve(join(commandsPath, command))];
                        var module = require(join(commandsPath, command));
                        
                        if (!module.config || !module.run) {
                            logger.loader(`❌ Invalid format: ${command}`, 'warn');
                            continue;
                        }
                        
                        if (global.client.commands.has(module.config.name)) {
                            logger.loader(`❌ Duplicate command name: ${module.config.name}`, 'warn');
                            continue;
                        }
                        
                        // Handle dependencies
                        if (module.config.dependencies && typeof module.config.dependencies == 'object') {
                            for (const reqDependencies in module.config.dependencies) {
                                try {
                                    if (!global.nodemodule.hasOwnProperty(reqDependencies)) {
                                        if (listPackage.hasOwnProperty(reqDependencies) || listbuiltinModules.includes(reqDependencies)) {
                                            global.nodemodule[reqDependencies] = require(reqDependencies);
                                        }
                                    }
                                } catch (error) {
                                    logger.loader(`⚠️ Missing dependency ${reqDependencies} for ${module.config.name}`, 'warn');
                                }
                            }
                        }
                        
                        // Handle config
                        if (module.config.envConfig) {
                            try {
                                for (const envConfig in module.config.envConfig) {
                                    if (typeof global.configModule[module.config.name] == 'undefined') global.configModule[module.config.name] = {};
                                    if (typeof global.config[module.config.name] == 'undefined') global.config[module.config.name] = {};
                                    if (typeof global.config[module.config.name][envConfig] !== 'undefined') {
                                        global.configModule[module.config.name][envConfig] = global.config[module.config.name][envConfig];
                                    } else {
                                        global.configModule[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
                                    }
                                    if (typeof global.config[module.config.name][envConfig] == 'undefined') {
                                        global.config[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
                                    }
                                }
                            } catch (error) {
                                logger.loader(`⚠️ Config error for ${module.config.name}: ${error}`, 'warn');
                            }
                        }
                        
                        // Enhanced onLoad with Database Safety
                        if (module.onLoad) {
                            try {
                                const moduleData = { 
                                    api: loginApiData, 
                                    models: botModel,
                                    databaseAvailable: !!botModel
                                };
                                module.onLoad(moduleData);
                            } catch (error) {
                                logger.loader(`⚠️ OnLoad error for ${module.config.name}: ${error.message}`, 'warn');
                            }
                        }
                        
                        if (module.handleEvent) global.client.eventRegistered.push(module.config.name);
                        global.client.commands.set(module.config.name, module);
                        logger.loader(`✅ Loaded command: ${module.config.name}`);
                        
                    } catch (error) {
                        logger.loader(`❌ Failed to load ${command}: ${error.message}`, 'error');
                    }
                }
            }
        } catch (error) {
            logger.loader(`❌ Commands folder error: ${error.message}`, 'error');
        }
        
        // Enhanced Events Loading
        try {
            const eventsPath = join(global.client.mainPath, 'Aman', 'events');
            if (existsSync(eventsPath)) {
                const events = readdirSync(eventsPath).filter(event => 
                    event.endsWith('.js') && 
                    !global.config.eventDisabled.includes(event)
                );
                
                for (const ev of events) {
                    try {
                        delete require.cache[require.resolve(join(eventsPath, ev))];
                        var event = require(join(eventsPath, ev));
                        
                        if (!event.config || !event.run) {
                            logger.loader(`❌ Invalid event format: ${ev}`, 'warn');
                            continue;
                        }
                        
                        if (global.client.events.has(event.config.name)) {
                            logger.loader(`❌ Duplicate event name: ${event.config.name}`, 'warn');
                            continue;
                        }
                        
                        // Handle dependencies
                        if (event.config.dependencies && typeof event.config.dependencies == 'object') {
                            for (const dependency in event.config.dependencies) {
                                try {
                                    if (!global.nodemodule.hasOwnProperty(dependency)) {
                                        if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) {
                                            global.nodemodule[dependency] = require(dependency);
                                        }
                                    }
                                } catch (error) {
                                    logger.loader(`⚠️ Missing dependency ${dependency} for ${event.config.name}`, 'warn');
                                }
                            }
                        }
                        
                        // Handle config
                        if (event.config.envConfig) {
                            try {
                                for (const envConfig in event.config.envConfig) {
                                    if (typeof global.configModule[event.config.name] == 'undefined') global.configModule[event.config.name] = {};
                                    if (typeof global.config[event.config.name] == 'undefined') global.config[event.config.name] = {};
                                    if (typeof global.config[event.config.name][envConfig] !== 'undefined') {
                                        global.configModule[event.config.name][envConfig] = global.config[event.config.name][envConfig];
                                    } else {
                                        global.configModule[event.config.name][envConfig] = event.config.envConfig[envConfig] || '';
                                    }
                                    if (typeof global.config[event.config.name][envConfig] == 'undefined') {
                                        global.config[event.config.name][envConfig] = event.config.envConfig[envConfig] || '';
                                    }
                                }
                            } catch (error) {
                                logger.loader(`⚠️ Config error for ${event.config.name}: ${error.message}`, 'warn');
                            }
                        }
                        
                        // Enhanced onLoad for events
                        if (event.onLoad) {
                            try {
                                const eventData = { 
                                    api: loginApiData, 
                                    models: botModel,
                                    databaseAvailable: !!botModel
                                };
                                event.onLoad(eventData);
                            } catch (error) {
                                logger.loader(`⚠️ OnLoad error for ${event.config.name}: ${error.message}`, 'warn');
                            }
                        }
                        
                        if (event.handleEvent) global.client.eventRegistered.push(event.config.name);
                        global.client.events.set(event.config.name, event);
                        logger.loader(`✅ Loaded event: ${event.config.name}`);
                        
                    } catch (error) {
                        logger.loader(`❌ Failed to load event ${ev}: ${error.message}`, 'error');
                    }
                }
            }
        } catch (error) {
            logger.loader(`❌ Events folder error: ${error.message}`, 'error');
        }
        
        logger.loader(`🎉 Loaded ${global.client.commands.size} commands and ${global.client.events.size} events`);
        logger.loader(`⚡ Startup Time: ${((Date.now() - global.client.timeStart) / 1000).toFixed()}s`);
        logger.loader('===== [ AMAN BOT STARTED ] =====');
        
        if (!botModel) {
            logger.loader('⚠️ Running without database - some features may be limited', 'warn');
        }
        
        // Save config
        try {
            writeFileSync(global.client.configPath, JSON.stringify(global.config, null, 4), 'utf8');
            if (existsSync(global.client.configPath + '.temp')) {
                unlinkSync(global.client.configPath + '.temp');
            }
        } catch (error) {
            logger.loader(`⚠️ Config save error: ${error.message}`, 'warn');
        }
        
        // Enhanced Listener Setup with Error Handling
        try {
            const listenerData = { 
                api: loginApiData, 
                models: botModel,
                databaseAvailable: !!botModel
            };
            const listener = require('./includes/listen.js')(listenerData);

            function listenerCallback(error, message) {
                if (error) return logger(`Listen error: ${JSON.stringify(error)}`, 'error');
                if (['presence', 'typ', 'read_receipt'].some(data => data == message.type)) return;
                if (global.config.DeveloperMode) console.log(message);
                
                try {
                    return listener(message);
                } catch (listenerError) {
                    console.log(`[LISTENER] Error processing message: ${listenerError.message}`);
                }
            }
            
            global.handleListen = loginApiData.listenMqtt(listenerCallback);
        } catch (error) {
            logger.loader(`❌ Listener setup error: ${error.message}`, 'error');
        }
        
        // Check ban
        try {
            await checkBan(loginApiData);
        } catch (error) {
            logger.loader(`⚠️ Ban check error: ${error.message}`, 'warn');
        }
        
        if (!global.checkBan) {
            logger.loader('⚠️ Warning: Source code verification failed', 'warn');
        }
        
        console.log("🚀 AMAN BOT IS NOW ONLINE AND READY! 🚀");
    });
}

//========= Enhanced Database Connection with Comprehensive Error Handling =========//

(async () => {
    if (!databaseAvailable) {
        logger('⚠️ Database module not available - starting without database', '[ DATABASE ]');
        const botData = { models: null };
        return onBot(botData);
    }

    let connectionAttempts = 0;
    const maxAttempts = 3;
    
    while (connectionAttempts < maxAttempts) {
        try {
            connectionAttempts++;
            logger(`🔄 Database connection attempt ${connectionAttempts}/${maxAttempts}`, '[ DATABASE ]');
            
            await sequelize.authenticate();
            
            try {
                const authentication = { Sequelize, sequelize };
                const models = require('./includes/database/model.js')(authentication);
                logger('✅ Database connected and models loaded successfully', '[ DATABASE ]');
                
                const botData = { models };
                return onBot(botData);
                
            } catch (modelError) {
                logger(`⚠️ Model initialization error: ${modelError.message}`, '[ DATABASE ]');
                
                if (modelError.message && modelError.message.includes('ValidationError')) {
                    logger('🔧 Attempting database schema fix...', '[ DATABASE ]');
                    
                    try {
                        await sequelize.sync({ force: true });
                        logger('✅ Database schema rebuilt successfully', '[ DATABASE ]');
                        
                        const authentication = { Sequelize, sequelize };
                        const models = require('./includes/database/model.js')(authentication);
                        const botData = { models };
                        return onBot(botData);
                        
                    } catch (syncError) {
                        logger(`❌ Database sync failed: ${syncError.message}`, '[ DATABASE ]');
                    }
                }
                
                if (connectionAttempts >= maxAttempts) {
                    logger('⚠️ Starting bot without database functionality', '[ DATABASE ]');
                    const botData = { models: null };
                    return onBot(botData);
                }
            }
            
        } catch (connectionError) {
            logger(`❌ Database connection attempt ${connectionAttempts} failed: ${connectionError.message}`, '[ DATABASE ]');
            
            if (connectionAttempts >= maxAttempts) {
                logger('❌ All database connection attempts failed - starting without database', '[ DATABASE ]');
                const botData = { models: null };
                return onBot(botData);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
})();

// Enhanced Error Handling
process.on('unhandledRejection', (err, p) => {
    console.log('🚫 Unhandled Rejection:', err?.message || err);
    if (err?.stack) console.log('Stack:', err.stack);
});

process.on('uncaughtException', (err) => {
    console.log('🚫 Uncaught Exception:', err?.message || err);
    if (err?.stack) console.log('Stack:', err.stack);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Graceful shutdown...');
    if (global.handleListen) {
        global.handleListen();
    }
    if (server) {
        server.close();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
    if (global.handleListen) {
        global.handleListen();
    }
    if (server) {
        server.close();
    }
    process.exit(0);
});
