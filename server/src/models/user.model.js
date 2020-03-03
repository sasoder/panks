/**
 * @class User
 */
class User {
    constructor(userID) {
        this.userID = userID;
        this.socket = null;
        this.currentRoom = null;
    }
}

module.exports = User