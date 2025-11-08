module.exports.config = {
  name: "help",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Owner AK",
  description: "Show all available commands",
  usePrefix: true,
  commandCategory: "System",
  usages: "help",
  cooldowns: 1,
  envConfig: {
    autoUnsend: false,
    delayUnsend: 300
  }
};

module.exports.run = function({ api, event, args }) {
  const { commands } = global.client;
  const { threadID } = event;

  // Array me sab commands ke naam
  const commandList = [];
  for (let [name] of commands) {
    commandList.push(name);
  }

  commandList.sort();

  // Message format
  let msg = "✧═══❁ ALL COMMANDS ❁═══✧\n\n";
  let i = 0;
  for (let name of commandList) {
    msg += `[${++i}] → ${global.config.PREFIX}${name}\n`;
  }

  msg += `\n\n*★᭄𝐎𝐰𝐧𝐞𝐫 𝐀 𝐊 ⚔️⏤͟͟͞͞★*`;
  msg += `\nOwner Id: https://www.facebook.com/AK47kx`;

  return api.sendMessage(msg, threadID);
};
