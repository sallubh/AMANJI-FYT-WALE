module.exports.config = {
  name: "prefix",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "Aman",
  description: "See the bot prefix with error handling",
  commandCategory: "For admin",
  usages: "out prefix",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ event, api, Threads }) => {
  // MAIN FIX: Added comprehensive null checks
  if (!event || !api || !Threads) return;
  
  var { threadID, messageID, body, senderID } = event;
  if (!threadID || !body) return;
  
  try {
    if ((this.config.credits) != "Aman") { 
      return api.sendMessage(`Changed credits!`, threadID, messageID);
    }
    
    function out(data) {
      api.sendMessage(data, threadID, messageID)
    }
    
    // FIXED: Added null checks for Threads.getData result
    let threadsData;
    try {
      threadsData = await Threads.getData(threadID);
    } catch (threadsError) {
      console.log("[Prefix] Threads getData error:", threadsError.message);
      threadsData = { data: {} };
    }
    
    var data = threadsData && threadsData.data ? threadsData.data : {}; // FIXED: Handle undefined data
    const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};

    var arr = ["mpre","mprefix","prefix", "dấu lệnh", "prefix của bot là gì","daulenh", "duong"];
    arr.forEach(i => {
      let str = i[0].toUpperCase() + i.slice(1);
      if (body === i.toUpperCase() | body === i | str === body) {
        const prefix = threadSetting.PREFIX || global.config.PREFIX || "/";
        
        if (!data || data.PREFIX == null) {
          return out(`🚀SONY BOT PREFIX ⇉ [ ${prefix} ]`)
        }
        else return out(`🛸SONY BOT PREFIX ⇉ 👉🏻 [ ${prefix} ]` + (data.PREFIX || ""))
      }
    });
  } catch (error) {
    console.log("[Prefix] HandleEvent error:", error.message);
    // Don't throw error, just log and continue
    return;
  }
};

module.exports.run = async({ event, api }) => {
  try {
    return api.sendMessage(`This is my prefix⇉ [ ${global.config.PREFIX || "/"} ]`, event.threadID)
  } catch (error) {
    console.log("[Prefix] Run error:", error.message);
    return api.sendMessage("❌ Error getting prefix!", event.threadID);
  }
}
