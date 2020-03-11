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
        this.game = null
    }

    addMessage(message) {
        this.messages.push(message);
    }

    addUser(user) {
        this.users.push(user);
    }

    removeUser(userToRemove) {
        this.users = this.users.filter((user) => user != userToRemove);
    }

    // TODO: Will this add new complexities on logging out and leaving rooms? probably :)
    addGame(game) {
        this.game = game;
    }
}

module.exports = Room;