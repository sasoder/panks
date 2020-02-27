/**
 * @class User
 */
class User {
    constructor(name) {
        this.socket = null;
        this.currentRoom = null;
        this.name = name;
        this.timeOfReservation = 0;
    }
}

module.exports = User