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
        // TODO fix host
        this.host = creator
        this.game = null
        this.activeGame = false
    }

    getData() {
        return {
            id: this.id,
            name: this.name,
            users: this.users.length,
            activeGame: this.activeGame,
            host: this.host,
            messages: this.messages
        }
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

    addGame(game) {
        this.game = game;
        this.activeGame = true;
    }
}

module.exports = Room;