/* jslint node: true */

'use strict';

// a lobby has rooms
const Lobby = require('./models/lobby.model');

const User = require('./models/user.model');
const Tank = require('./models/tank.model');
const Room = require('./models/room.model');

/**
 * rooms & users are effectively hash maps with the name of the entry serving as a unique key.
 */
let nextRoomID = 0;
let rooms = {};
let users = {};

let tanks = {};

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


// TODO: Rememeber to remove room objects once a game is finished. Once ID counter goes over limit (back to zero) then old games should be gone from that index.
exports.addRoom = (roomName, creatorID) => {

    // Don't allow a user to have more than one room
    if (Object.values(rooms).some(room => room.creator === creatorID)) {
        return false;
    }
    
    rooms[nextRoomID] = new Room(nextRoomID, roomName, creatorID);
    // Make it so that only people in lobby get emitted of this info
    exports.io.in('lobby').emit('newRoom', rooms[nextRoomID]);
    nextRoomID += 1;
    return true
};

exports.getRooms = () => Object.values(rooms);

exports.removeRoom = (id) => {
    // Clean out all users from room
    // TODO uncaught in promise for user who left room
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