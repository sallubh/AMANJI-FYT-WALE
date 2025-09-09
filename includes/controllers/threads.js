module.exports = function ({ models, api }) {
    const Threads = models.use('Threads');

    /**
     * Get thread info from Facebook API
     * @param {string|number} threadID - Thread ID
     */
    async function getInfo(threadID) {
        if (!threadID) throw new Error("Thread ID is required");
        
        try {
            const result = await api.getThreadInfo(threadID);
            return result;
        } catch (error) {
            console.error('getInfo thread error:', error);
            throw new Error(`Failed to get thread info: ${error.message}`);
        }
    }

    /**
     * Get all threads with optional filters
     * @param {...*} data - Filter objects or attribute arrays
     */
    async function getAll(...data) {
        var where, attributes;
        
        for (const i of data) {
            if (typeof i != 'object') {
                throw new Error("Parameters must be objects or arrays");
            }
            if (Array.isArray(i)) attributes = i;
            else where = i;
        }
        
        try {
            const results = await Threads.findAll({ where, attributes });
            return results.map(e => e.get({ plain: true }));
        } catch (error) {
            console.error('getAll threads error:', error);
            throw new Error(`Failed to get threads: ${error.message}`);
        }
    }

    /**
     * Get thread data from database
     * @param {string|number} threadID - Thread ID
     */
    async function getData(threadID) {
        if (!threadID) throw new Error("Thread ID is required");
        
        try {
            const data = await Threads.findOne({ where: { threadID } });
            return data ? data.get({ plain: true }) : null;
        } catch (error) {
            console.error('getData thread error:', error);
            throw new Error(`Failed to get thread data: ${error.message}`);
        }
    }

    /**
     * Update thread data
     * @param {string|number} threadID - Thread ID
     * @param {Object} options - Update options
     */
    async function setData(threadID, options = {}) {
        if (!threadID) throw new Error("Thread ID is required");
        if (typeof options != 'object' || Array.isArray(options)) {
            throw new Error("Options must be an object");
        }
        
        try {
            const thread = await Threads.findOne({ where: { threadID } });
            if (thread) {
                await thread.update(options);
                return true;
            } else {
                // Create new record if doesn't exist
                await createData(threadID, options);
                return true;
            }
        } catch (error) {
            console.error('setData thread error:', error);
            throw new Error(`Failed to set thread data: ${error.message}`);
        }
    }

    /**
     * Delete thread data
     * @param {string|number} threadID - Thread ID
     */
    async function delData(threadID) {
        if (!threadID) throw new Error("Thread ID is required");
        
        try {
            const thread = await Threads.findOne({ where: { threadID } });
            if (thread) {
                await thread.destroy();
                return true;
            }
            return false;
        } catch (error) {
            console.error('delData thread error:', error);
            throw new Error(`Failed to delete thread data: ${error.message}`);
        }
    }

    /**
     * Create new thread record
     * @param {string|number} threadID - Thread ID
     * @param {Object} defaults - Default values
     */
    async function createData(threadID, defaults = {}) {
        if (!threadID) throw new Error("Thread ID is required");
        if (typeof defaults != 'object' || Array.isArray(defaults)) {
            throw new Error("Defaults must be an object");
        }
        
        try {
            const [thread, created] = await Threads.findOrCreate({ 
                where: { threadID }, 
                defaults: {
                    threadInfo: {},
                    data: {},
                    ...defaults
                }
            });
            return { thread: thread.get({ plain: true }), created };
        } catch (error) {
            console.error('createData thread error:', error);
            throw new Error(`Failed to create thread data: ${error.message}`);
        }
    }

    /**
     * Update thread info from Facebook API and save to database
     * @param {string|number} threadID - Thread ID
     */
    async function updateThreadInfo(threadID) {
        if (!threadID) throw new Error("Thread ID is required");
        
        try {
            const threadInfo = await getInfo(threadID);
            await setData(threadID, { threadInfo });
            return threadInfo;
        } catch (error) {
            console.error('updateThreadInfo error:', error);
            throw new Error(`Failed to update thread info: ${error.message}`);
        }
    }

    /**
     * Get thread settings (data field)
     * @param {string|number} threadID - Thread ID
     */
    async function getSettings(threadID) {
        if (!threadID) throw new Error("Thread ID is required");
        
        try {
            const threadData = await getData(threadID);
            return threadData ? (threadData.data || {}) : {};
        } catch (error) {
            console.error('getSettings error:', error);
            throw new Error(`Failed to get thread settings: ${error.message}`);
        }
    }

    /**
     * Update thread settings
     * @param {string|number} threadID - Thread ID
     * @param {Object} settings - Settings to update
     */
    async function setSettings(threadID, settings = {}) {
        if (!threadID) throw new Error("Thread ID is required");
        if (typeof settings != 'object' || Array.isArray(settings)) {
            throw new Error("Settings must be an object");
        }
        
        try {
            const currentData = await getData(threadID);
            const currentSettings = currentData ? (currentData.data || {}) : {};
            const newSettings = { ...currentSettings, ...settings };
            
            await setData(threadID, { data: newSettings });
            return true;
        } catch (error) {
            console.error('setSettings error:', error);
            throw new Error(`Failed to set thread settings: ${error.message}`);
        }
    }

    /**
     * Check if thread is banned
     * @param {string|number} threadID - Thread ID
     */
    async function isBanned(threadID) {
        if (!threadID) throw new Error("Thread ID is required");
        
        try {
            const settings = await getSettings(threadID);
            return settings.banned === true;
        } catch (error) {
            console.error('isBanned error:', error);
            return false;
        }
    }

    return {
        getInfo,
        getAll,
        getData,
        setData,
        delData,
        createData,
        updateThreadInfo,
        getSettings,
        setSettings,
        isBanned
    };
};
