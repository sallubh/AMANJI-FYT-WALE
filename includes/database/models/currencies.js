module.exports = function({ sequelize, Sequelize }) {
    const Currencies = sequelize.define('Currencies', {
        num: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userID: {
            type: Sequelize.BIGINT,
            unique: true,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'User ID is required'
                },
                notEmpty: {
                    msg: 'User ID cannot be empty'
                }
            }
        },
        money: {
            type: Sequelize.BIGINT,
            defaultValue: 0,
            validate: {
                min: {
                    args: [0],
                    msg: 'Money cannot be negative'
                }
            }
        },
        exp: {
            type: Sequelize.BIGINT,
            defaultValue: 0,
            validate: {
                min: {
                    args: [0],
                    msg: 'Experience cannot be negative'
                }
            }
        },
        data: {
            type: Sequelize.JSON,
            defaultValue: {},
            get() {
                const rawValue = this.getDataValue('data');
                return rawValue || {};
            }
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userID']
            },
            {
                fields: ['money']
            },
            {
                fields: ['exp']
            }
        ],
        hooks: {
            beforeCreate: (currency, options) => {
                if (!currency.data) {
                    currency.data = {};
                }
                if (currency.money === null || currency.money === undefined) {
                    currency.money = 0;
                }
                if (currency.exp === null || currency.exp === undefined) {
                    currency.exp = 0;
                }
            },
            beforeUpdate: (currency, options) => {
                if (!currency.data) {
                    currency.data = {};
                }
            }
        }
    });

    return Currencies;
};
