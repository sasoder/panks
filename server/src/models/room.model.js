/**
 * @class Room
 */
class Room {
    constructor(id, name, creator) {
        this.id = id;
        this.name = name;
        this.messages = [];
        // Array of userIDs
        this.users = [];
        // UserID that created the room
        this.creator = creator
    }

    addMessage(message) {
        this.messages.push(message);
    }
    addUser(user) {
        this.users.push(user);
    }
    removeUser(userID) {
        this.users = this.users.filter((user) => user !== userID);
    }
}

module.exports = Room;