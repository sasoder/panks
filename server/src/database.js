const path = require('path'); // helper library for resolving relative paths
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const saltRounds = 8;

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'db.sqlite'),
});

const User = sequelize.define('user', {
    // Model attributes are defined here
    username: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    password: DataTypes.STRING,
    times_played: DataTypes.INTEGER,
    total_score: DataTypes.INTEGER,
    total_wins: DataTypes.INTEGER
}, {
    sequelize,
    tableName: 'Users',
});

User.prototype.setHashPassword = function setHashPassword(password) {
    this.set('password', bcrypt.hashSync(password, saltRounds));
};

User.prototype.validPassword = function validPassword(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = {
    sequelize,
    User
};