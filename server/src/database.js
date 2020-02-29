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


// * - Code used for hardcoding in Users as a start

/*const pass1 = '123';
const pass2 = '234';
(async () => {
    await sequelize.sync();
    const user1 = await User.create({
        username: 'samuel',
        password: '',
    });
    user1.set('password', bcrypt.hashSync(pass1, saltRounds));
    await user1.save();
    const user2 = await User.create({
        username: 'pierre',
        password: '',
    });
    user2.set('password', bcrypt.hashSync(pass2, saltRounds));
    await user2.save();
    console.log(user1.toJSON());
    console.log(user2.toJSON());
})();*/


module.exports = {
    sequelize,
    User
};