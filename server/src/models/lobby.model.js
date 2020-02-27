/**
 * @class Lobby
 */
class Lobby {
    constructor(name) {
        this.messages = [];
        this.name = name;
    }

    addMessage(message) {
        this.messages.push(message);
    }
}

module.exports = Lobby;