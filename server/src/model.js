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
let rooms = {};
let users = {};

let tanks = {};
let lobbies = {};

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
const assignUnregisteredSocket = (socketID) => {
    const socket = unregisteredSockets[socketID];
    unregisteredSockets = Object.keys(unregisteredSockets)
        .filter((sockID) => sockID !== socketID)
        .reduce((res, sockID) => ({ ...res, [sockID]: unregisteredSockets[sockID] }), {});

    return socket;
};

/**
 * Add a message to a room & push out the message to all connected clients
 * @param {String} roomName - The name of the room to add the message to.
 * @param {String} message - The message to add.
 * @returns {void}
 */
exports.addMessage = (roomName, message) => {
    exports.findRoom(roomName).addMessage(message);
    exports.io.in(roomName).emit('msg', message);
    console.log(roomName, message);
};

/**
 * Creates a user with the given name.
 * @param {String} name - The name of the user.
 * @param {Number} socketID - An optional ID of a socket.io socket in the unregistered sockets pool.
 * @see model.addUnregisteredSocket
 * @returns {void}
 */
exports.addUser = (name, socketID = undefined) => {
    users[name] = new User(name);
    if (socketID !== undefined) {
        users[name].socket = assignUnregisteredSocket(socketID);
    }
};

/**
 * Updated the socket associated with the user with the given name.
 * @param {String} name - The name of the user.
 * @param {SocketIO.Socket} socket - A socket.io socket.
 * @returns {void}
 */
exports.updateUserSocket = (name, socket) => {
    users[name].socket = socket;
};

/**
 * Returns the user object with the given name.
 * @param {String} name - The name of the user.
 * @returns {User}
 */
exports.findUser = (name) => users[name];

/**
 * Returns the timeslot object with the given id.
 * @param {Int} id - The id of the timeslot.
 * @returns {TimeSlot}
 */
exports.findTimeSlot = (id) => timeslots[id];

/**
 * Returns all the Timeslots.
 * @returns {Timeslots[]}
 */
exports.getTimeslots = () => Object.values(timeslots);

/**
 * Returns all the Timeslots based on an assistant ID.
 * @returns {Timeslots[]}
 */
exports.getTimeslotsByAssistantName = (assName) => Object.values(timeslots)
    .filter((timeslot) => timeslot.assistantName === assName);

/**
 * Creates an assistant with the given username.
 * @param {String} name - The username of the assistant.
 * @param {Number} socketID - An optional ID of a socket.io socket in the unregistered sockets pool.
 * @see model.addUnregisteredSocket
 * @returns {void}
 */
exports.addTimeSlot = (id, assistantName, time, bookedBy) => {
    timeslots[id] = new TimeSlot(id, assistantName, time, bookedBy);
    console.log(`adding a timeslot: ${JSON.stringify(timeslots[id])}`);
    exports.io.emit('newTimeSlot', timeslots[id]);
};

/**
 * Removes the timeslot object with the matching id.
 * @param {int} id - The id of the timeslot.
 * @returns {void}
 */
exports.removeTimeSlot = (id) => {
    timeslots = Object.values(timeslots)
        .filter((timeslot) => timeslot.id !== id)
        .reduce((res, timeslot) => ({ ...res, [timeslot.id]: timeslot }), {});

    // Creating an array of the timeslots instead of dictionary
    const newTimeslots = [];
    Object.keys(timeslots).forEach((key) => {
        newTimeslots.push(timeslots[key]);
    });

    // Returning new array of timeslots to user
    exports.io.emit('removedTimeSlot', newTimeslots);
};

/**
 * Reserves the timeslot object with the matching id.
 * @param {int} id - The id of the timeslot.
 * @returns {void}
 */
exports.reserveTimeSlot = (id, userID) => {
    timeslots[id].reserved = userID;
    users[userID].timeOfReservation = Date.now();
    exports.io.emit('updatedTimeSlot', timeslots[id]);
};

/**
 * Reserves the timeslot object with the matching id.
 * @param {int} id - The id of the timeslot.
 * @returns {void}
 */
exports.cancelReservationTimeSlot = (id) => {
    if (timeslots[id] !== undefined) {
        timeslots[id].reserved = null;
        exports.io.emit('updatedTimeSlot', timeslots[id]);
    }
};

/**
 * Books the timeslot object with the matching id.
 * @param {int} id - The id of the timeslot.
 * @returns {void}
 */
exports.bookTimeSlot = (id, userID) => {
    timeslots[id].bookedBy = userID;
    timeslots[id].reserved = null;
    exports.io.emit('updatedTimeSlot', timeslots[id]);
};

/**
 * Creates an assistant with the given username.
 * @param {String} name - The username of the assistant.
 * @param {Number} socketID - An optional ID of a socket.io socket in the unregistered sockets pool.
 * @see model.addUnregisteredSocket
 * @returns {void}
 */
exports.addAssistant = (username, password) => {
    assistants[username] = new Assistant(username, password);
};

/**
 * Returns the assistant object with the given id.
 * @param {String} username - The username of the assistant.
 * @returns {User}
 */
exports.findAssistant = (username) => assistants[username];

/**
 * Removes the room object with the matching name.
 * @param {String} name - The name of the room.
 * @returns {void}
 */
exports.removeRoom = (name) => {
    users = Object.values(users)
        .filter((user) => user.name !== name)
        .reduce((res, user) => ({ ...res, [user.name]: user }), {});
};

/**
 * Creates a room with the given name.
 * @param {String} name - The name of the room.
 * @returns {void}
 */
exports.addRoom = (name) => {
    rooms[name] = new Room(name);
};

/**
 * Returns all the Rooms.
 * @returns {Room[]}
 */
exports.getRooms = () => Object.values(rooms);

/**
 * Removes the room object with the matching name.
 * @param {String} name - The name of the room.
 * @returns {void}
 */
exports.removeRoom = (name) => {
    rooms = Object.values(rooms)
        .filter((room) => room.name !== name)
        .reduce((res, room) => ({ ...res, [room.name]: room }), {});
};

/**
 * Return the room object with the matching name.
 * @param {String} name - The name of the room.
 * @returns {Room}
 */
exports.findRoom = (name) => rooms[name];