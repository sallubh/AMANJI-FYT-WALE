module.exports.config = {
	name: "outall",
	version: "1.0.2",
	hasPermssion: 2,
	credits: "Aman",
	description: "Leave all groups with multiple methods",
	commandCategory: "Admin",
	usages: "outall [method]",
	cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
	const { threadID, messageID } = event;
	
	// Show available methods if no args
	if (!args[0]) {
		return api.sendMessage(
			"🔹 **OutAll Methods Available:**\n\n" +
			"1. `/outall method1` - Using getThreadList\n" +
			"2. `/outall method2` - Using thread history\n" +
			"3. `/outall method3` - Manual group detection\n" +
			"4. `/outall confirm` - Force leave (if you know group IDs)\n\n" +
			"⚠️ All methods will leave ALL groups except current one!",
			threadID, messageID
		);
	}
	
	const method = args[0].toLowerCase();
	
	try {
		switch (method) {
			case 'method1':
				return await useMethod1(api, event);
			case 'method2':
				return await useMethod2(api, event);
			case 'method3':  
				return await useMethod3(api, event);
			case 'confirm':
				return await forceLeave(api, event);
			default:
				return api.sendMessage("❌ Invalid method! Use: method1, method2, method3, or confirm", threadID, messageID);
		}
	} catch (error) {
		console.error("[OutAll] Error:", error);
		return api.sendMessage("❌ Process failed: " + error.message, threadID, messageID);
	}
};

// Method 1: Enhanced getThreadList with better error handling
async function useMethod1(api, event) {
	const { threadID } = event;
	
	return new Promise((resolve) => {
		console.log("[OutAll] Trying Method 1 - Enhanced getThreadList");
		
		// Try with different parameters
		const attempts = [
			{ limit: 20, timestamp: null, tags: ["INBOX"] },
			{ limit: 50, timestamp: null, tags: ["INBOX"] },
			{ limit: 10, timestamp: null, tags: [] },
			{ limit: 100, timestamp: null, tags: ["INBOX"] }
		];
		
		let attemptIndex = 0;
		
		function tryNextAttempt() {
			if (attemptIndex >= attempts.length) {
				api.sendMessage("❌ All getThreadList attempts failed. Try method2 or method3.", threadID);
				return resolve();
			}
			
			const attempt = attempts[attemptIndex++];
			console.log(`[OutAll] Attempt ${attemptIndex}: limit=${attempt.limit}, tags=${JSON.stringify(attempt.tags)}`);
			
			api.getThreadList(attempt.limit, attempt.timestamp, attempt.tags, (err, list) => {
				if (err) {
					console.error(`[OutAll] Attempt ${attemptIndex} failed:`, err.message);
					setTimeout(tryNextAttempt, 2000);
					return;
				}
				
				if (!list || list.length === 0) {
					console.log(`[OutAll] Attempt ${attemptIndex} returned empty list`);
					setTimeout(tryNextAttempt, 2000);
					return;
				}
				
				console.log(`[OutAll] Attempt ${attemptIndex} success: ${list.length} threads found`);
				processThreadList(api, event, list);
				resolve();
			});
		}
		
		tryNextAttempt();
	});
}

// Method 2: Use global thread data
async function useMethod2(api, event) {
	const { threadID } = event;
	
	console.log("[OutAll] Trying Method 2 - Global thread data");
	
	try {
		// Check if global thread data exists
		if (!global.data || !global.data.allThreadID) {
			return api.sendMessage(
				"❌ Method 2 failed: No global thread data available.\n" + 
				"Try method1 or method3", 
				threadID
			);
		}
		
		const allThreads = global.data.allThreadID;
		console.log(`[OutAll] Found ${allThreads.length} threads in global data`);
		
		if (allThreads.length === 0) {
			return api.sendMessage("❌ No threads found in global data.", threadID);
		}
		
		const botID = api.getCurrentUserID();
		let successful = 0;
		let failed = 0;
		
		api.sendMessage(`🔄 Processing ${allThreads.length} threads from global data...`, threadID);
		
		for (let i = 0; i < allThreads.length; i++) {
			const thread = allThreads[i];
			
			// Skip current thread
			if (thread === threadID || thread.toString() === threadID.toString()) {
				continue;
			}
			
			try {
				await new Promise((resolve, reject) => {
					api.removeUserFromGroup(botID, thread, (err) => {
						if (err) {
							console.log(`[OutAll] Failed to leave ${thread}: ${err.message}`);
							failed++;
						} else {
							console.log(`[OutAll] Successfully left ${thread}`);
							successful++;
						}
						resolve();
					});
				});
				
				// Delay between leaves
				await new Promise(resolve => setTimeout(resolve, 1500));
				
			} catch (error) {
				failed++;
			}
		}
		
		return api.sendMessage(
			`✅ Method 2 completed!\n` +
			`📊 Successful: ${successful}\n` +
			`❌ Failed: ${failed}`,
			threadID
		);
		
	} catch (error) {
		return api.sendMessage("❌ Method 2 error: " + error.message, threadID);
	}
}

// Method 3: Manual thread detection
async function useMethod3(api, event) {
	const { threadID } = event;
	
	console.log("[OutAll] Trying Method 3 - Manual detection");
	
	return api.sendMessage(
		"🔹 **Method 3: Manual Group Detection**\n\n" +
		"This method requires you to provide group IDs manually.\n\n" +
		"**Steps:**\n" +
		"1. Use `/threads` command to list groups\n" +
		"2. Copy group IDs\n" +
		"3. Use `/outall manual [threadID1] [threadID2] ...`\n\n" +
		"**Example:**\n" +
		"`/outall manual 123456789 987654321 555666777`\n\n" +
		"Or try other methods first.",
		threadID
	);
}

// Force leave with manual thread IDs
async function forceLeave(api, event) {
	const { threadID, args } = event;
	
	if (args.length < 2) {
		return api.sendMessage(
			"⚠️ **Force Leave Method**\n\n" +
			"Provide thread IDs to leave:\n" +
			"`/outall confirm [threadID1] [threadID2] ...`\n\n" +
			"⚠️ Use carefully - this will immediately leave specified groups!",
			threadID
		);
	}
	
	const threadsToLeave = args.slice(1);
	const botID = api.getCurrentUserID();
	let successful = 0;
	let failed = 0;
	
	api.sendMessage(`🔄 Force leaving ${threadsToLeave.length} specified groups...`, threadID);
	
	for (const thread of threadsToLeave) {
		// Skip current thread
		if (thread === threadID || thread.toString() === threadID.toString()) {
			continue;
		}
		
		try {
			await new Promise((resolve) => {
				api.removeUserFromGroup(botID, thread, (err) => {
					if (err) {
						console.log(`[OutAll] Failed to leave ${thread}: ${err.message}`);
						failed++;
					} else {
						console.log(`[OutAll] Successfully left ${thread}`);
						successful++;
					}
					resolve();
				});
			});
			
			await new Promise(resolve => setTimeout(resolve, 2000));
			
		} catch (error) {
			failed++;
		}
	}
	
	return api.sendMessage(
		`✅ Force leave completed!\n` +
		`📊 Successful: ${successful}\n` +
		`❌ Failed: ${failed}`,
		threadID
	);
}

// Process thread list (shared function)
async function processThreadList(api, event, list) {
	const { threadID } = event;
	const botID = api.getCurrentUserID();
	
	// Filter groups
	const groups = list.filter(item => 
		item.isGroup === true && 
		item.threadID !== threadID
	);
	
	if (groups.length === 0) {
		return api.sendMessage("ℹ️ No groups found to leave!", threadID);
	}
	
	api.sendMessage(`🔄 Found ${groups.length} groups. Starting leave process...`, threadID);
	
	let successful = 0;
	let failed = 0;
	
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		
		try {
			await new Promise((resolve) => {
				api.removeUserFromGroup(botID, group.threadID, (err) => {
					if (err) {
						console.log(`[OutAll] Failed: ${group.threadID} - ${err.message}`);
						failed++;
					} else {
						console.log(`[OutAll] Success: ${group.threadID}`);
						successful++;
					}
					resolve();
				});
			});
			
			// Progress update every 5 groups
			if ((i + 1) % 5 === 0) {
				api.sendMessage(`📊 Progress: ${i + 1}/${groups.length} (Success: ${successful}, Failed: ${failed})`, threadID);
			}
			
			await new Promise(resolve => setTimeout(resolve, 1500));
			
		} catch (error) {
			failed++;
		}
	}
	
	return api.sendMessage(
		`✅ Process completed!\n` +
		`📊 Total: ${groups.length}\n` +
		`✅ Successful: ${successful}\n` +
		`❌ Failed: ${failed}`,
		threadID
	);
}
