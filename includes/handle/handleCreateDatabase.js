module.exports = function ({ Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    
    return async function ({ event }) {
        const { allUserID, allCurrenciesID, allThreadID, userName, threadInfo } = global.data; 
        const { autoCreateDB } = global.config;
        
        if (autoCreateDB == false) return;
        
        var { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);
        
        try {
            // Create thread data if not exists
            if (!allThreadID.includes(threadID) && event.isGroup == true) {
                const threadIn4 = await Threads.getInfo(threadID);
                
                const setting = {
                    threadName: threadIn4.threadName,
                    adminIDs: threadIn4.adminIDs,
                    nicknames: threadIn4.nicknames
                };
                
                const dataThread = setting;
                allThreadID.push(threadID);
                threadInfo.set(threadID, dataThread);
                
                const setting2 = {
                    threadInfo: dataThread,
                    data: {}
                };
                
                await Threads.setData(threadID, setting2);
                
                // Create user data for all thread members
                for (const singleData of threadIn4.userInfo) {
                    userName.set(String(singleData.id), singleData.name);
                    
                    try {
                        if (global.data.allUserID.includes(String(singleData.id))) {
                            await Users.setData(String(singleData.id), {
                                'name': singleData.name
                            });
                        } else {
                            await Users.createData(singleData.id, {
                                'name': singleData.name,
                                'data': {}
                            });
                            global.data.allUserID.push(String(singleData.id));
                            logger(global.getText('handleCreateDatabase', 'newUser', singleData.id), '[ DATABASE ]');
                        }
                    } catch(e) { 
                        console.log('User creation error:', e);
                    }
                }
                
                logger(global.getText('handleCreateDatabase', 'newThread', threadID), '[ DATABASE ]');
            }
            
            // Create user data if not exists
            if (!allUserID.includes(senderID) || !userName.has(senderID)) {
                const infoUsers = await Users.getInfo(senderID);
                const setting3 = {
                    name: infoUsers.name
                };
                
                await Users.createData(senderID, setting3);
                allUserID.push(senderID);
                userName.set(senderID, infoUsers.name);
                logger(global.getText('handleCreateDatabase', 'newUser', senderID), '[ DATABASE ]');
            }
            
            // Create currency data if not exists
            if (!allCurrenciesID.includes(senderID)) {
                const setting4 = {
                    data: {}
                };
                
                await Currencies.createData(senderID, setting4);
                allCurrenciesID.push(senderID);
            }
            
            return;
        } catch (err) {
            console.log('Database creation error:', err);
        }
    };
};
