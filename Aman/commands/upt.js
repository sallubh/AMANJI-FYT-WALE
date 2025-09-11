module.exports.config = {
	name: "upt",
	version: "1.0.2",
	hasPermssion: 0,
	credits: "Aman Khan",
	description: "Kiểm tra thời gian bot đã online",
	commandCategory: "system",
	cooldowns: 5,
	dependencies: {
		"pidusage": ""
	}
};

function byte2mb(bytes) {
	const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	let l = 0, n = parseInt(bytes, 10) || 0;
	while (n >= 1024 && ++l) n = n / 1024;
	return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

module.exports.languages = {
	"vi": {
		"returnResult": "Bot đã hoạt động được %1 giờ %2 phút %3 giây.\n\n❯ Tổng người dùng: %4\n❯ Tổng Nhóm: %5\n❯ Cpu đang sử dụng: %6%\n❯ Ram đang sử dụng: %7\n❯ Ping: %8ms\n\n=== This bot made by AK ==="
	},
	"en": {
		"returnResult": "Bot has been working for %1 hour(s) %2 minute(s) %3 second(s).\n\n❯ Total users: %4\n❯ Total Groups: %5\n❯ Cpu usage: %6%\n❯ RAM usage: %7\n❯ Ping: %8ms\n\n=== This bot made by AK ==="
	}
}

module.exports.run = async ({ api, event, getText }) => {
	try {
		const time = process.uptime(),
			hours = Math.floor(time / (60 * 60)),
			minutes = Math.floor((time % (60 * 60)) / 60),
			seconds = Math.floor(time % 60);

		let pidusage;
		try {
			pidusage = await global.nodemodule["pidusage"](process.pid);
		} catch (error) {
			console.error("Pidusage error:", error);
			pidusage = {
				cpu: 0,
				memory: process.memoryUsage().rss
			};
		}

		const timeStart = Date.now();
		const userCount = global.data.allUserID ? global.data.allUserID.length : 0;
		const threadCount = global.data.allThreadID ? global.data.allThreadID.length : 0;
		
		return api.sendMessage("", event.threadID, () => api.sendMessage(getText("returnResult", hours, minutes, seconds, userCount, threadCount, pidusage.cpu.toFixed(1), byte2mb(pidusage.memory), Date.now() - timeStart), event.threadID, event.messageID));
	} catch (error) {
		console.error("Uptime command error:", error);
		return api.sendMessage("Error getting bot statistics. Please try again.", event.threadID, event.messageID);
	}
}
