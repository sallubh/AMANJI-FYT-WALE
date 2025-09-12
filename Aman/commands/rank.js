module.exports.config = {
	name: "rank",
	version: "1.0.1",
	hasPermssion: 0,
	credits: "Aman", 
	description: "rank with error handling",
	commandCategory: "Group",
	cooldowns: 5,
	dependencies: {
		"fs-extra": "",
		"path": "",
		"jimp": "",
		"node-superfetch": "",
		"canvas": ""
	}
};

function getRandomColor() {
  	var letters = '0123456789ABCDEF';
 	var color = '#';
  	for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

module.exports.makeRankCard = async (data) => {    
    const fs = global.nodemodule["fs-extra"];
    const path = global.nodemodule["path"];
	const Canvas = global.nodemodule["canvas"];
	const request = global.nodemodule["node-superfetch"];
	const __root = path.resolve(__dirname, "cache");
	const PI = Math.PI;

    const { id, name, rank, level, expCurrent, expNextLevel } = data;

    // Safety checks
    if (!id || !name || rank === undefined || level === undefined) {
        throw new Error("Missing required data for rank card");
    }

	try {
		Canvas.registerFont(__root + "/regular-font.ttf", {
			family: "Manrope",
			weight: "regular",
			style: "normal"
		});
		Canvas.registerFont(__root + "/bold-font.ttf", {
			family: "Manrope",
			weight: "bold",
			style: "normal"
		});
	} catch (fontError) {
		console.log("[Rank] Font registration error:", fontError.message);
	}

	const pathCustom = path.resolve(__dirname, "cache", "customrank");
	let dirImage = __root + "/rankcard1.png"; // Default fallback
	
	try {
		if (fs.existsSync(pathCustom)) {
			var customDir = fs.readdirSync(pathCustom);
			let random = Math.floor(Math.random() * 9) + 1;
			var randomCard = __root + "/rankcard" + random + ".png";
			
			if (fs.existsSync(randomCard)) {
				dirImage = randomCard;
			}

			customDir = customDir.map(item => item.replace(/\.png/g, ""));

			for (singleLimit of customDir) {
				var limitRate = false;
				const split = singleLimit.split(/-/g);
				var min = parseInt(split[0]), max = parseInt((split[1]) ? split[1] : min);
			
				for (; min <= max; min++) {
					if (level == min) {
						limitRate = true;
						break;
					}
				}

				if (limitRate == true) {
					dirImage = pathCustom + `/${singleLimit}.png`;
					break;
				}
			}
		}
	} catch (dirError) {
		console.log("[Rank] Directory read error:", dirError.message);
	}

	let rankCard = await Canvas.loadImage(dirImage);
	const pathImg = __root + `/rank_${id}.png`;
	
	var expWidth = (expCurrent * 615) / expNextLevel;
	if (expWidth > 615 - 18.5) expWidth = 615 - 18.5;
	
	let avatar = await request.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

	avatar = await this.circle(avatar.body);

	const canvas = Canvas.createCanvas(934, 282);
	const ctx = canvas.getContext("2d");

	ctx.drawImage(rankCard, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(await Canvas.loadImage(avatar), 45, 50, 180, 180);

	ctx.font = `bold 36px Manrope`;
	ctx.fillStyle = getRandomColor();
	ctx.textAlign = "start";
	ctx.fillText(name.substring(0, 20), 270, 164); // Limit name length

	ctx.font = `bold 35px Manrope`;
	ctx.fillStyle = getRandomColor();
	ctx.textAlign = "end";
	ctx.fillText(level, 610 - 55, 82);
	ctx.fillStyle = getRandomColor();
	ctx.fillText("Level:", 610 - 55 - ctx.measureText(level).width - 10, 82);

	ctx.font = `bold 32px Manrope`;
	ctx.fillStyle = getRandomColor();
	ctx.textAlign = "end";
	ctx.fillText(rank, 934 - 55 - ctx.measureText(level).width - 16 - ctx.measureText(`Lv.`).width - 25, 82);
	ctx.fillStyle = getRandomColor();
	ctx.fillText("#", 934 - 55 - ctx.measureText(level).width - 16 - ctx.measureText(`Lv.`).width - 16 - ctx.measureText(rank).width - 16, 82);

	ctx.font = `bold 26px Manrope`;
	ctx.fillStyle = getRandomColor();
	ctx.textAlign = "start";
	ctx.fillText("/ " + expNextLevel, 710 + ctx.measureText(expCurrent).width + 10, 164);
	ctx.fillStyle = getRandomColor();
	ctx.fillText(expCurrent, 710, 164);

	ctx.beginPath();
	ctx.fillStyle = getRandomColor();
	ctx.arc(257 + 18.5, 147.5 + 18.5 + 36.25, 18.5, 1.5 * PI, 0.5 * PI, true);
	ctx.fill();
	ctx.fillRect(257 + 18.5, 147.5 + 36.25, expWidth, 37.5);
	ctx.arc(257 + 18.5 + expWidth, 147.5 + 18.5 + 36.25, 18.75, 1.5 * PI, 0.5 * PI, false);
	ctx.fill();

	const imageBuffer = canvas.toBuffer();
	fs.writeFileSync(pathImg, imageBuffer);
	return pathImg;
}

module.exports.circle = async (image) => {
    const jimp = global.nodemodule["jimp"];
	image = await jimp.read(image);
	image.circle();
	return await image.getBufferAsync("image/png");
}

module.exports.expToLevel = (point) => {
	if (point < 0) return 0;
	return Math.floor((Math.sqrt(1 + (4 * point) / 3) + 1) / 2);
}

module.exports.levelToExp = (level) => {
	if (level <= 0) return 0;
	return 3 * level * (level - 1);
}

module.exports.getInfo = async (uid, Currencies) => {
	try {
		let currencyData = await Currencies.getData(uid);
		let point = currencyData ? currencyData.exp || 0 : 0;
		
		const level = this.expToLevel(point);
		const expCurrent = point - this.levelToExp(level);
		const expNextLevel = this.levelToExp(level + 1) - this.levelToExp(level);
		return { level, expCurrent, expNextLevel };
	} catch (error) {
		console.log("[Rank] getInfo error:", error.message);
		return { level: 0, expCurrent: 0, expNextLevel: 100 };
	}
}

module.exports.onLoad = async function () {
	const { resolve } = global.nodemodule["path"];
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { downloadFile } = global.utils;
	const path = resolve(__dirname, "cache", "customrank");
    if (!existsSync(path)) mkdirSync(path, { recursive: true });

	try {
		if (!existsSync(resolve(__dirname, 'cache', 'regular-font.ttf'))) await downloadFile("https://github.com/J-JRT/JRT_main/blob/mainV2/modules/commands/cache/regular-font.ttf?raw=true", resolve(__dirname, 'cache', 'regular-font.ttf'));
		if (!existsSync(resolve(__dirname, 'cache', 'bold-font.ttf'))) await downloadFile("https://github.com/J-JRT/JRT_main/blob/mainV2/modules/commands/cache/bold-font.ttf?raw=true", resolve(__dirname, 'cache', 'bold-font.ttf'));
		if (!existsSync(resolve(__dirname, 'cache', 'rankcard1.png'))) await downloadFile("https://imgur.com/cD7W8yS.png", resolve(__dirname, 'cache', 'rankcard1.png'));
		if (!existsSync(resolve(__dirname, 'cache', 'rankcard2.png'))) await downloadFile("https://imgur.com/AVkl1ON.png", resolve(__dirname, 'cache', 'rankcard2.png'));
	} catch (downloadError) {
		console.log("[Rank] Download error:", downloadError.message);
	}
}

module.exports.run = async ({ event, api, args, Currencies, Users, Threads }) => {
	try {
		const fs = global.nodemodule["fs-extra"];
		
		// Safety checks
		if (!Currencies || !Users) {
			return api.sendMessage("❌ Database not available!", event.threadID, event.messageID);
		}
		
		let dataAll = await Currencies.getAll(["userID", "exp"]);
		if (!dataAll || !Array.isArray(dataAll)) {
			return api.sendMessage("❌ Unable to fetch ranking data!", event.threadID, event.messageID);
		}

		const mention = Object.keys(event.mentions || {});
				
		dataAll.sort((a, b) => {
			if (a.exp > b.exp) return -1;
			if (a.exp < b.exp) return 1;
			return 0;
		});

		if (args.length == 0) {
			const name = global.data.userName.get(event.senderID) || await Users.getNameUser(event.senderID);
			
			if (!name) {
				return api.sendMessage("❌ Unable to get user name!", event.threadID, event.messageID);
			}

			const listUserID = event.participantIDs || [];
			var exp = [];
			
			for(const idUser of listUserID) {
				try {
					const countMess = await Currencies.getData(idUser);
					exp.push({
						"name": idUser.name || "Unknown", 
						"exp": countMess && countMess.exp ? countMess.exp : 0, 
						"uid": idUser
					});
				} catch (userError) {
					console.log("[Rank] User data error:", userError.message);
				}
			}
			
			exp.sort(function (a, b) { return b.exp - a.exp });
			const pek = exp.findIndex(info => parseInt(info.uid) == parseInt(event.senderID)) + 1; 
			const infoUser = exp[pek - 1] || { exp: 0 };
			const rank = dataAll.findIndex(item => parseInt(item.userID) == parseInt(event.senderID)) + 1; 

			if (rank == 0) return api.sendMessage("You are currently not in the database, please try again in 5 seconds.", event.threadID, event.messageID);

			const point = await this.getInfo(event.senderID, Currencies);
			let pathRankCard = await this.makeRankCard({ id: event.senderID, name, rank, ...point })
			
			api.setMessageReaction("✅", event.messageID, (err) => {}, true)
			return api.sendMessage({
				body: `Name: ${name}\nTop: ${rank}\nTotal messages: ${infoUser.exp}`, 
				attachment: fs.createReadStream(pathRankCard) 
			}, event.threadID, () => fs.unlinkSync(pathRankCard), event.messageID);
		}                                       
							
		if (mention.length >= 1) {
			const userID = mention[0];
			const listUserID = event.participantIDs || [];
			var exp = [];
			
			for(const idUser of listUserID) {
				try {
					const countMess = await Currencies.getData(idUser);
					exp.push({
						"name": idUser.name || "Unknown", 
						"exp": countMess && countMess.exp ? countMess.exp : 0, 
						"uid": idUser
					});
				} catch (userError) {
					console.log("[Rank] User data error:", userError.message);
				}
			}
			
			exp.sort(function (a, b) { return b.exp - a.exp });
			const pek = exp.findIndex(info => parseInt(info.uid) == parseInt(userID)) + 1; 
			const infoUser = exp[pek - 1] || { exp: 0 };
			const rank = dataAll.findIndex(item => parseInt(item.userID) == parseInt(userID)) + 1;
			const name = global.data.userName.get(userID) || await Users.getNameUser(userID);
			
			if (rank == 0) return api.sendMessage("Error❌ Please try again in 5 seconds.", event.threadID, event.messageID);
			
			let point = await this.getInfo(userID, Currencies);
			let pathRankCard = await this.makeRankCard({ id: userID, name, rank, ...point })
			
			api.setMessageReaction("✅", event.messageID, (err) => {}, true)
			return api.sendMessage({
				body: `Name: ${name}\nTop: ${rank}\nTotal messages: ${infoUser.exp}`, 
				attachment: fs.createReadStream(pathRankCard) 
			}, event.threadID, () => fs.unlinkSync(pathRankCard), event.messageID);
		}
	} catch (error) {
		console.log("[Rank] Main error:", error.message);
		return api.sendMessage("❌ An error occurred while processing rank command!", event.threadID, event.messageID);
	}
			}
