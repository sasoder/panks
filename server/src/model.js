/* jslint node: true */

'use strict';

// a lobby has rooms
const Lobby = require('./models/lobby.model');
const User = require('./models/user.model');

const Room = require('./models/room.model');
const Game = require('./models/game.model');

/**
 * rooms & users are effectively hash maps with the name of the entry serving as a unique key.
 */
let nextRoomID = 0;
let rooms = {};
let users = {};

/**
 * unregisteredSockets is used as a temporary pool of sockets
 * that belonging to users who are yet to login.
 */
let nextUnregisteredSocketID = 0;
let unregisteredSockets = {};

// Will be initialized in the exports.init function
exports.io = undefined;

/**
 * Initialize the model
 * @param { { io: SocketIO.Server} } config - The configurations needed to initialize the model.
 * @returns {void}
 */
exports.init = ({ io }) => {
    exports.io = io;
};

/**
 * Add a socket.io socket to the pool of unregistered sockets
 * @param {SocketIO.Socket} socket - The socket.io socket to add to the pool.
 * @returns {Number} The ID of the socket in the pool of unregistered sockets.
 */
exports.addUnregisteredSocket = (socket) => {
    const socketID = nextUnregisteredSocketID;
    nextUnregisteredSocketID += 1;

    unregisteredSockets[socketID] = socket;
    return socketID;
};

// Once you connect, a socket is assigned to the pool that corresponds to your connection.
// Once you actually log in (addUser) the socket gets assigned to you.
const assignUnregisteredSocket = (socketID) => {
    const socket = unregisteredSockets[socketID];
    unregisteredSockets = Object.keys(unregisteredSockets)
        .filter((sockID) => sockID !== socketID)
        .reduce((res, sockID) => ({ ...res, [sockID]: unregisteredSockets[sockID] }), {});

    return socket;
};

exports.addMessage = (roomID, message) => {
    const room = rooms[roomID]
    rooms[roomID].addMessage(message);
    exports.io.in(roomID).emit('msg', message);
    console.log(roomID, room.name, message);
};

exports.joinRoom = (roomID, userID) => {
    let room = rooms[roomID];
    // Set the current room of the user
    users[userID].currentRoom = roomID;
    // Join the right socket.io room
    users[userID].socket.leave('lobby');
    users[userID].socket.join(roomID);
    // Add the user to the corresponding room
    rooms[roomID].addUser(userID);
    
    // Updated Rooms with users
    exports.io.in('lobby').emit('updatedRoomList', Object.values(rooms)); 
    exports.io.in(roomID).emit('updatedUserList', room.users);
    console.log("Added user to room ", roomID, " with ID: ", userID);
};

exports.leaveRoom = (roomID, userID) => {
    // Set the current room of the user to null
    users[userID].currentRoom = null;
    // Join the right socket.io room
    users[userID].socket.leave(roomID);
    users[userID].socket.join('lobby');
    // Remove the user to the corresponding room
    rooms[roomID].removeUser(userID);
    
    // Updated Rooms with users
    exports.io.in('lobby').emit('updatedRoomList', Object.values(rooms));
    exports.io.in(roomID).emit('updatedUserList', rooms[roomID].users);
    console.log("User left room ", roomID, " with ID: ", userID);
};

exports.addUser = (userID, socketID = undefined) => {
    users[userID] = new User(userID);
    if (socketID !== undefined) {
        users[userID].socket = assignUnregisteredSocket(socketID);
    }
    // Log in the user into the lobby at creation
    users[userID].socket.join('lobby');
};

exports.updateUserSocket = (userID, socket) => {
    users[userID].socket = socket;
};

exports.findUser = (userID) => users[userID];


exports.removeUser = (userID) => {
    // Remove user from server
    users = Object.values(users)
        .filter((user) => user.id !== userID)
        .reduce((res, user) => ({ ...res, [user.id]: user }), {});

    // TODO: Emit somehting?
};

exports.userHasRoom = (userID) => {
    return Object.values(rooms).find(room => room.creator === userID);
}

// Assumes from outer call that user has a room
exports.changeCreator = (userID) => {
    let userRoom = exports.userHasRoom(userID);
    // Change to next player
    let newCreator = userRoom.users[0];
    // TODO: Does this change the actual dictionary 'rooms'?
    userRoom.creator = newCreator.userID;
    // Need to emit info about new creator, since that person should now see settings
    // TODO: Test if this works
    exports.io.in(userRoom.id).emit('newCreator', newCreator.userID);
}

// TODO: Remember to remove room objects once a game is finished. Once ID counter goes over limit (back to zero) then old games should be gone from that index.
exports.addRoom = (roomName, creator) => {
    rooms[nextRoomID] = new Room(nextRoomID, roomName, creator);
    // Make it so that only people in lobby get emitted of this info
    exports.io.in('lobby').emit('newRoom', rooms[nextRoomID]);
    nextRoomID += 1;
};


exports.getRooms = () => Object.values(rooms);


exports.removeRoom = (id) => {
    // Clean out all users from room
    const room = rooms[id];
    const roomUsers = room.users;
    roomUsers.forEach(userID => {
        // Set the current room of the user to null
        users[userID].currentRoom = null;
        // Join the right socket.io room
        users[userID].socket.join('lobby');
    })

    // Remove room from server
    rooms = Object.values(rooms)
        .filter((room) => room.id !== id)
        .reduce((res, room) => ({ ...res, [room.id]: room }), {});

    // Make it so that only people in lobby get emitted of this info
    // Doing Object.values since we want an array of rooms, not the dictionary
    exports.io.in(id).emit('deletedRoom');
    exports.io.in('lobby').emit('updatedRoomList', Object.values(rooms));
};

exports.findRoom = (id) => rooms[id];


exports.startGame = (roomID, width, height, amplitude) => {
    let room = rooms[roomID];
    
    room.addGame(new Game(roomID, room.users, width, height, amplitude));
    exports.io.in(roomID).emit('startGame');
}

// the updateGame that the server calls on update
exports.sendInitGameState = (gameState) => {
    // ... and emit new gamestate to all players in the room
    exports.io.in(gameState.roomID).emit('updatePlayer', gameState);
}

// called from game.model
// idHp is of structure:
/*
idHp = {
    pList: hashMap with id as key and hp as value
    gameScreen
}
*/
exports.bulletExplosion = (roomID, idHp) => {
    exports.io.in(roomID).emit('explosion', idHp)
}

// called from game.model
exports.emitShot = (roomID, bullet) => {
    exports.io.in(roomID).emit('newShot', bullet)
}

// id: id of player to move
// player: player dirs with following structure:
/*
player = {
            barrelRight,
            barrelLeft,
            tankLeft,
            tankRight,
            up,
            down,
            space,
        }
*/
exports.updatePlayerBools = (id, player) => {
    exports.findRoom(roomID).game.movePlayer(id, player);
}

/** called from game.model
 * id = playerId of game
 */
exports.gameEnd = (roomID, id) => {
    exports.findRoom(roomID).emit('gameOver', id)
}