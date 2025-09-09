module.exports = function ({ models }) {
    const Currencies = models.use('Currencies');

    /**
     * Get all currencies with optional filters
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
            const results = await Currencies.findAll({ where, attributes });
            return results.map(e => e.get({ plain: true }));
        } catch (error) {
            console.error('getAll currencies error:', error);
            throw new Error(`Failed to get currencies: ${error.message}`);
        }
    }

    /**
     * Get currency data for specific user
     * @param {string|number} userID - User ID
     */
    async function getData(userID) {
        if (!userID) throw new Error("User ID is required");
        
        try {
            const data = await Currencies.findOne({ where: { userID } });
            return data ? data.get({ plain: true }) : null;
        } catch (error) {
            console.error('getData currencies error:', error);
            throw new Error(`Failed to get currency data: ${error.message}`);
        }
    }

    /**
     * Update currency data for user
     * @param {string|number} userID - User ID
     * @param {Object} options - Update options
     */
    async function setData(userID, options = {}) {
        if (!userID) throw new Error("User ID is required");
        if (typeof options != 'object' || Array.isArray(options)) {
            throw new Error("Options must be an object");
        }
        
        try {
            const currency = await Currencies.findOne({ where: { userID } });
            if (currency) {
                await currency.update(options);
                return true;
            } else {
                // Create new record if doesn't exist
                await createData(userID, options);
                return true;
            }
        } catch (error) {
            console.error('setData currencies error:', error);
            throw new Error(`Failed to set currency data: ${error.message}`);
        }
    }

    /**
     * Delete currency data for user
     * @param {string|number} userID - User ID
     */
    async function delData(userID) {
        if (!userID) throw new Error("User ID is required");
        
        try {
            const currency = await Currencies.findOne({ where: { userID } });
            if (currency) {
                await currency.destroy();
                return true;
            }
            return false;
        } catch (error) {
            console.error('delData currencies error:', error);
            throw new Error(`Failed to delete currency data: ${error.message}`);
        }
    }

    /**
     * Create new currency record
     * @param {string|number} userID - User ID
     * @param {Object} defaults - Default values
     */
    async function createData(userID, defaults = {}) {
        if (!userID) throw new Error("User ID is required");
        if (typeof defaults != 'object' || Array.isArray(defaults)) {
            throw new Error("Defaults must be an object");
        }
        
        try {
            const [currency, created] = await Currencies.findOrCreate({ 
                where: { userID }, 
                defaults: {
                    money: 0,
                    exp: 0,
                    data: {},
                    ...defaults
                }
            });
            return { currency: currency.get({ plain: true }), created };
        } catch (error) {
            console.error('createData currencies error:', error);
            throw new Error(`Failed to create currency data: ${error.message}`);
        }
    }

    /**
     * Increase user's money
     * @param {string|number} userID - User ID
     * @param {number} money - Amount to add
     */
    async function increaseMoney(userID, money) {
        if (!userID) throw new Error("User ID is required");
        if (typeof money != 'number' || money < 0) {
            throw new Error("Money must be a positive number");
        }
        
        try {
            const userData = await getData(userID);
            if (!userData) {
                await createData(userID, { money: money });
                return true;
            }
            
            const newBalance = (userData.money || 0) + money;
            await setData(userID, { money: newBalance });
            return true;
        } catch (error) {
            console.error('increaseMoney error:', error);
            throw new Error(`Failed to increase money: ${error.message}`);
        }
    }

    /**
     * Decrease user's money
     * @param {string|number} userID - User ID
     * @param {number} money - Amount to subtract
     */
    async function decreaseMoney(userID, money) {
        if (!userID) throw new Error("User ID is required");
        if (typeof money != 'number' || money < 0) {
            throw new Error("Money must be a positive number");
        }
        
        try {
            const userData = await getData(userID);
            if (!userData) return false;
            
            const currentBalance = userData.money || 0;
            if (currentBalance < money) return false;
            
            const newBalance = currentBalance - money;
            await setData(userID, { money: newBalance });
            return true;
        } catch (error) {
            console.error('decreaseMoney error:', error);
            throw new Error(`Failed to decrease money: ${error.message}`);
        }
    }

    /**
     * Increase user's experience
     * @param {string|number} userID - User ID
     * @param {number} exp - Experience to add
     */
    async function increaseExp(userID, exp) {
        if (!userID) throw new Error("User ID is required");
        if (typeof exp != 'number' || exp < 0) {
            throw new Error("Experience must be a positive number");
        }
        
        try {
            const userData = await getData(userID);
            if (!userData) {
                await createData(userID, { exp: exp });
                return true;
            }
            
            const newExp = (userData.exp || 0) + exp;
            await setData(userID, { exp: newExp });
            return true;
        } catch (error) {
            console.error('increaseExp error:', error);
            throw new Error(`Failed to increase experience: ${error.message}`);
        }
    }

    /**
     * Get user's balance
     * @param {string|number} userID - User ID
     */
    async function getBalance(userID) {
        if (!userID) throw new Error("User ID is required");
        
        try {
            const userData = await getData(userID);
            return userData ? (userData.money || 0) : 0;
        } catch (error) {
            console.error('getBalance error:', error);
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    return {
        getAll,
        getData,
        setData,
        delData,
        createData,
        increaseMoney,
        decreaseMoney,
        increaseExp,
        getBalance
    };
};
