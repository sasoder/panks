/**
 * @class User
 */
class User {
    constructor(userID, ip) {
        this.userID = userID;
        this.ip = ip;
        this.socket = null;
        this.currentRoom = null;
    }
}

module.exports = User