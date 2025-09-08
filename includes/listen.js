// includes/listen.js
module.exports = function ({ api, models }) {
    const fs = require("fs");
    const Users = require("./controllers/users")({ models, api });
    const Threads = require("./controllers/threads")({ models, api });
    const Currencies = require("./controllers/currencies")({ models });
    const logger = require("../utils/log.js");
    const moment = require('moment-timezone');
    const axios = require("axios");
    
    var day = moment.tz("Asia/Kolkata").day();

    // Daily interaction check system
    const checkttDataPath = __dirname + '/../Aman/commands/checktuongtac/';
    
    setInterval(async () => {
        const day_now = moment.tz("Asia/Kolkata").day();
        const _ADMINIDs = [...global.config.NDH, ...global.config.ADMINBOT];
        
        try {
            if (day != day_now) {
                day = day_now;
                const checkttData = fs.readdirSync(checkttDataPath).filter(file => {
                    const _ID = file.replace('.json', '');
                    return _ADMINIDs.includes(_ID) || global.data.allThreadID.includes(_ID);
                });
                
                console.log('Daily activity check running...');
                
                // Daily reports
                await new Promise(async resolve => {
                    for (const checkttFile of checkttData) {
                        const checktt = JSON.parse(fs.readFileSync(checkttDataPath + checkttFile));
                        let storage = [], count = 1;
                        
                        for (const item of checktt.day) {
                            const userName = await Users.getNameUser(item.id) || 'Unknown User';
                            const itemToPush = item;
                            itemToPush.name = userName;
                            storage.push(itemToPush);
                        }
                        
                        storage.sort((a, b) => {
                            if (a.count > b.count) return -1;
                            else if (a.count < b.count) return 1;
                            else return a.name.localeCompare(b.name);
                        });
                        
                        let checkttBody = '=== DAILY ACTIVITY REPORT ===\n\n';
                        checkttBody += storage.slice(0, 10).map(item => {
                            return `${count++}. ${item.name} with ${item.count} message${item.count > 1 ? 's' : ''}`;
                        }).join('\n');
                        
                        api.sendMessage(checkttBody, checkttFile.replace('.json', ''), (err) => {
                            if (err) console.log('Daily report error:', err);
                        });

                        checktt.day.forEach(e => {
                            e.count = 0;
                        });
                        checktt.time = day_now;
                        fs.writeFileSync(checkttDataPath + checkttFile, JSON.stringify(checktt, null, 4));
                    }
                    resolve();
                });

                // Weekly reports (Monday)
                await new Promise(async resolve => {
                    if (day_now == 1) {
                        console.log('Weekly activity check running...');
                        
                        for (const checkttFile of checkttData) {
                            const checktt = JSON.parse(fs.readFileSync(checkttDataPath + checkttFile));
                            let storage = [], count = 1;
                            
                            for (const item of checktt.week) {
                                const userName = await Users.getNameUser(item.id) || 'Unknown User';
                                const itemToPush = item;
                                itemToPush.name = userName;
                                storage.push(itemToPush);
                            }
                            
                            storage.sort((a, b) => {
                                if (a.count > b.count) return -1;
                                else if (a.count < b.count) return 1;
                                else return a.name.localeCompare(b.name);
                            });
                            
                            let checkttBody = '=== WEEKLY ACTIVITY REPORT ===\n\n';
                            checkttBody += storage.slice(0, 10).map(item => {
                                return `${count++}. ${item.name} with ${item.count} message${item.count > 1 ? 's' : ''}`;
                            }).join('\n');
                            
                            api.sendMessage(checkttBody, checkttFile.replace('.json', ''), (err) => {
                                if (err) console.log('Weekly report error:', err);
                            });
                            
                            checktt.week.forEach(e => {
                                e.count = 0;
                            });
                            fs.writeFileSync(checkttDataPath + checkttFile, JSON.stringify(checktt, null, 4));
                        }
                    }
                    resolve();
                });

                global.client.sending_top = false;
            }
        } catch(e) { 
            console.error('Activity check error:', e);
        }
    }, 1000 * 10);

    //////////////////////////////////////////////////////////////////////
    //========= Push all variable from database to environment =========//
    //////////////////////////////////////////////////////////////////////

    (async function () {
        try {
            logger(global.getText('listen', 'startLoadEnvironment'), '[ AMAN-BOT ]');
            
            let threads = await Threads.getAll();
            let users = await Users.getAll(['userID', 'name', 'data']);
            let currencies = await Currencies.getAll(['userID']);
            
            for (const data of threads) {
                const idThread = String(data.threadID);
                global.data.allThreadID.push(idThread);
                global.data.threadData.set(idThread, data['data'] || {});
                global.data.threadInfo.set(idThread, data.threadInfo || {});
                
                if (data['data'] && data['data']['banned'] == true) {
                    global.data.threadBanned.set(idThread, {
                        'reason': data['data']['reason'] || '',
                        'dateAdded': data['data']['dateAdded'] || ''
                    });
                }
                
                if (data['data'] && data['data']['commandBanned'] && data['data']['commandBanned']['length'] != 0) {
                    global['data']['commandBanned']['set'](idThread, data['data']['commandBanned']);
                }
                
                if (data['data'] && data['data']['NSFW']) {
                    global['data']['threadAllowNSFW']['push'](idThread);
                }
            }
            logger.loader(global.getText('listen', 'loadedEnvironmentThread'));
            
            for (const dataU of users) {
                const idUsers = String(dataU['userID']);
                global.data['allUserID']['push'](idUsers);
                
                if (dataU.name && dataU.name['length'] != 0) {
                    global.data.userName['set'](idUsers, dataU.name);
                }
                
                if (dataU.data && dataU.data.banned == 1) {
                    global.data['userBanned']['set'](idUsers, {
                        'reason': dataU['data']['reason'] || '',
                        'dateAdded': dataU['data']['dateAdded'] || ''
                    });
                }
                
                if (dataU['data'] && dataU.data['commandBanned'] && dataU['data']['commandBanned']['length'] != 0) {
                    global['data']['commandBanned']['set'](idUsers, dataU['data']['commandBanned']);
                }
            }
            
            for (const dataC of currencies) {
                global.data.allCurrenciesID.push(String(dataC['userID']));
            }
            
            logger.loader(global.getText('listen', 'loadedEnvironmentUser'));
            logger(global.getText('listen', 'successLoadEnvironment'), '[ AMAN-BOT ]');
        } catch (error) {
            return logger.loader(global.getText('listen', 'failLoadEnvironment', error), 'error');
        }
    }());

    logger(`[ ${global.config.PREFIX} ] • ${(!global.config.BOTNAME) ? "AMAN-BOT" : global.config.BOTNAME}`, "[ AMAN-BOT ]");

    ///////////////////////////////////////////////
    //========= Require all handle need =========//
    //////////////////////////////////////////////

    const handleCommand = require("./handle/handleCommand")({ api, models, Users, Threads, Currencies });
    const handleCommandEvent = require("./handle/handleCommandEvent")({ api, models, Users, Threads, Currencies });
    const handleReply = require("./handle/handleReply")({ api, models, Users, Threads, Currencies });
    const handleReaction = require("./handle/handleReaction")({ api, models, Users, Threads, Currencies });
    const handleEvent = require("./handle/handleEvent")({ api, models, Users, Threads, Currencies });
    const handleCreateDatabase = require("./handle/handleCreateDatabase")({ api, Threads, Users, Currencies, models });

    // Schedule system
    const datlichPath = __dirname + "/../Aman/commands/cache/datlich.json";

    const monthToMSObj = {
        1: 31 * 24 * 60 * 60 * 1000,
        2: 28 * 24 * 60 * 60 * 1000,
        3: 31 * 24 * 60 * 60 * 1000,
        4: 30 * 24 * 60 * 60 * 1000,
        5: 31 * 24 * 60 * 60 * 1000,
        6: 30 * 24 * 60 * 60 * 1000,
        7: 31 * 24 * 60 * 60 * 1000,
        8: 31 * 24 * 60 * 60 * 1000,
        9: 30 * 24 * 60 * 60 * 1000,
        10: 31 * 24 * 60 * 60 * 1000,
        11: 30 * 24 * 60 * 60 * 1000,
        12: 31 * 24 * 60 * 60 * 1000
    };

    const checkTime = (time) => new Promise((resolve) => {
        time.forEach((e, i) => time[i] = parseInt(String(e).trim()));
        const getDayFromMonth = (month) => {
            if (month == 0) return 0;
            if (month == 2) return (time[2] % 4 == 0) ? 29 : 28;
            return ([1, 3, 5, 7, 8, 10, 12].includes(month)) ? 31 : 30;
        };
        
        if (time[1] > 12 || time[1] < 1) resolve("Invalid month");
        if (time[0] > getDayFromMonth(time[1]) || time[0] < 1) resolve("Invalid date");
        if (time[2] < 2022) resolve("Invalid year");
        if (time[3] > 23 || time[3] < 0) resolve("Invalid hour");
        if (time[4] > 59 || time[4] < 0) resolve("Invalid minute");
        if (time[5] > 59 || time[5] < 0) resolve("Invalid second");
        
        const yr = time[2] - 1970;
        let yearToMS = yr * 365 * 24 * 60 * 60 * 1000;
        yearToMS += Math.floor((yr - 2) / 4) * 24 * 60 * 60 * 1000;
        
        let monthToMS = 0;
        for (let i = 1; i < time[1]; i++) monthToMS += monthToMSObj[i];
        if (time[2] % 4 == 0) monthToMS += 24 * 60 * 60 * 1000;
        
        const dayToMS = time[0] * 24 * 60 * 60 * 1000;
        const hourToMS = time[3] * 60 * 60 * 1000;
        const minuteToMS = time[4] * 60 * 1000;
        const secondToMS = time[5] * 1000;
        const oneDayToMS = 24 * 60 * 60 * 1000;
        
        const timeMs = yearToMS + monthToMS + dayToMS + hourToMS + minuteToMS + secondToMS - oneDayToMS;
        resolve(timeMs);
    });

    const tenMinutes = 10 * 60 * 1000;

    const checkAndExecuteEvent = async () => {
        try {
            if (!fs.existsSync(datlichPath)) {
                fs.writeFileSync(datlichPath, JSON.stringify({}, null, 4));
            }
            
            var data = JSON.parse(fs.readFileSync(datlichPath));
            var timeVN = moment().tz('Asia/Kolkata').format('DD/MM/YYYY_HH:mm:ss');
            timeVN = timeVN.split("_");
            timeVN = [...timeVN[0].split("/"), ...timeVN[1].split(":")];

            let temp = [];
            let vnMS = await checkTime(timeVN);
            
            const compareTime = e => new Promise(async (resolve) => {
                let getTimeMS = await checkTime(e.split("_"));
                if (getTimeMS < vnMS) {
                    if (vnMS - getTimeMS < tenMinutes) {
                        data[boxID][e]["TID"] = boxID;
                        temp.push(data[boxID][e]);
                        delete data[boxID][e];
                    } else {
                        delete data[boxID][e];
                    }
                    fs.writeFileSync(datlichPath, JSON.stringify(data, null, 4));
                }
                resolve();
            });

            await new Promise(async (resolve) => {
                for (boxID in data) {
                    for (e of Object.keys(data[boxID])) {
                        await compareTime(e);
                    }
                }
                resolve();
            });

            for (el of temp) {
                try {
                    var all = (await Threads.getInfo(el["TID"])).participantIDs;
                    all.splice(all.indexOf(api.getCurrentUserID()), 1);
                    var body = el.REASON || "📅 Scheduled reminder", mentions = [];

                    for (let i = 0; i < all.length; i++) {
                        if (i == body.length) body += " ‍ ";
                        mentions.push({
                            tag: body[i],
                            id: all[i],
                            fromIndex: i - 1
                        });
                    }
                } catch (e) { 
                    console.log('Schedule error:', e);
                    continue;
                }
                
                var out = { body, mentions };
                
                if ("ATTACHMENT" in el) {
                    out.attachment = [];
                    for (a of el.ATTACHMENT) {
                        try {
                            let getAttachment = (await axios.get(encodeURI(a.url), { responseType: "arraybuffer" })).data;
                            fs.writeFileSync(__dirname + `/../Aman/commands/cache/${a.fileName}`, Buffer.from(getAttachment));
                            out.attachment.push(fs.createReadStream(__dirname + `/../Aman/commands/cache/${a.fileName}`));
                        } catch (err) {
                            console.log('Attachment error:', err);
                        }
                    }
                }
                
                if ("BOX" in el) await api.setTitle(el["BOX"], el["TID"]);
                
                api.sendMessage(out, el["TID"], () => {
                    if ("ATTACHMENT" in el) {
                        el.ATTACHMENT.forEach(a => {
                            try {
                                fs.unlinkSync(__dirname + `/../Aman/commands/cache/${a.fileName}`);
                            } catch (err) {
                                console.log('File cleanup error:', err);
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Schedule check error:', error);
        }
    };
    
    setInterval(checkAndExecuteEvent, tenMinutes / 10);

    //////////////////////////////////////////////////
    //========= Send event to handle need =========//
    /////////////////////////////////////////////////

    return (event) => {
        switch (event.type) {
            case "message":
            case "message_reply":
            case "message_unsend":
                handleCreateDatabase({ event });
                handleCommand({ event });
                handleReply({ event });
                handleCommandEvent({ event });
                break;
                
            case "event":
                handleEvent({ event });
                break;
                
            case "message_reaction":
                handleReaction({ event });
                break;
                
            default:
                break;
        }
    };
};
