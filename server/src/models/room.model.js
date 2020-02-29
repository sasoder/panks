/**
 * @class Room
 */
class Room {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.messages = [];
        this.players = [];
    }

    addMessage(message) {
        this.messages.push(message);
    }
    addPlayer(player) {
        this.players.push(player);
    }
}

module.exports = Room;