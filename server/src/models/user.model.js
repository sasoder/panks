/**
 * @class User
 */
class User {
    constructor(name) {
        this.socket = null;
        this.currentRoom = null;
        this.name = name;
    }
}

module.exports = User