/**
 * @class Room
 */
class Room {
    constructor(name) {
        this.messages = [];
        this.players = [];
        this.name = name;
    }

    addMessage(message) {
        this.messages.push(message);
    }
    addPlayer(player) {
        this.players.push(player);
    }
}

module.exports = Room;