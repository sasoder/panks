/* jslint node: true */

"use strict";

const User = require("./models/user.model");

const Room = require("./models/room.model");
const Game = require("./models/game.model");

const { sequelize } = require("./database");

/**
 * rooms & users are effectively hash maps with the name of the entry serving as a unique key.
 */
let nextRoomID = 0;
let rooms = {};
let users = {};
let userTimeouts = {};

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
    .reduce(
      (res, sockID) => ({ ...res, [sockID]: unregisteredSockets[sockID] }),
      {}
    );

  return socket;
};

exports.addMessage = (roomID, message) => {
  const room = rooms[roomID];
  if (room) {
    room.addMessagmessage);
  }
};

exports.joinRoom = (roomID, user) => {
  let room = rooms[roomID];
  // Set the current room of the user
  user.currentRoom = roomID;
  // Join the right socket.io room
  user.socket.leave("lobby");
  user.socket.join(roomID);

  // Add the user to the corresponding room, only if they aren't already in the room
  if (!room.users.some((u) => u.userID === user.userID)) {
    // Send join message
    exports.addMessage(user.currentRoom, `${user.userID} joined the room!`);
    room.addUser(user.getData());
  }

  // if you joined an empty room, become the host
  if (room.users.length === 1) {
    exports.changeHost(roomID);
  }

  // Updated Rooms with users
  exports.io.in("lobby").emit(
    "updatedRoomList",
    Object.values(rooms).map((room) => room.getData())
  );

  exports.io
    .in(roomID)
    .emit("updatedUserList", { users: room.users, host: room.host });
  console.log("Added user to room ", roomID, " with ID:", user.userID);
};

exports.leaveRoom = (roomID, userID) => {
  let user = users[userID];
  let room = rooms[roomID];
  // User leaves the game upon leaving the room
  if (room != undefined && room.game != null) room.game.leaveGame(userID);

  // Set the current room of the user to null
  user.currentRoom = null;
  // Join the right socket.io room
  if(user.socket) {
    user.socket.leave(roomID);
    user.socket.join("lobby");
  }
  // Remove the user of the corresponding room
  room.removeUser(user);

  // if the user who left is the host and there is at least one person left in the room
  if (room.host === userID && room.users.length > 0) {
    let newHost = exports.changeHost(roomID);
    exports.addMessage(
      roomID,
      "Host left the room. " + newHost + " is the new host..."
    );
  }

  // Updated Rooms with users
  exports.io.in("lobby").emit(
    "updatedRoomList",
    Object.values(rooms).map((room) => room.getData())
  );
  exports.io
    .in(roomID)
    .emit("updatedUserList", { users: room.users, host: room.host });
  console.log("User left room ", roomID, " with ID: ", userID);
};

exports.changeHost = (roomID) => {
  let room = rooms[roomID];
  room.host = room.users[0].userID;
  return room.host;
};

exports.addUser = (userID, socketID = undefined) => {
  if (users[userID] == undefined) {
    users[userID] = new User(userID);
  }
  if (socketID !== undefined) {
    users[userID].socket = assignUnregisteredSocket(socketID);
    users[userID].socketID = users[userID].socket.id;
    users[userID].sessionID = users[userID].socket.handshake.sessionID;
  }
  // Log in the user into the lobby at creation, or other rooms it was in before
  if (users[userID].currentRoom) {
    exports.io.to(userID).emit("joinedRoom", users[userID].currentRoom);
  }

  // Set up timeout for user
  // userTimeouts[userID] = setTimeout(() => { exports.logoutUser(userID) }, 1000 * 10); // 10 sec (debugging)
  userTimeouts[userID] = setTimeout(() => {
    exports.logoutUser(userID);
  }, 1000 * 60 * 10); // 10 min
};

exports.updateTimeoutOnUser = (userID) => {
  // Stop current timeout
  clearTimeout(userTimeouts[userID]);
  // Reset timeout
  // userTimeouts[userID] = setTimeout(() => { exports.logoutUser(userID) }, 1000 * 10); // 10 sec (debugging)
  userTimeouts[userID] = setTimeout(() => {
    exports.logoutUser(userID);
  }, 1000 * 60 * 10); // 10 min
};

exports.logoutUser = (userID) => {
  const user = users[userID];

  const roomOfUser = findRoomByHost(userID);

  if (user.currentRoom !== null) {
    // Notify that user disconnected
    exports.addMessage(user.currentRoom, `${user.userID} disconnected.`);
    // Let user leave room
    exports.leaveRoom(user.currentRoom, user.userID);
  }

  // If user is host of a room, delete it
  if (roomOfUser !== undefined) {
    // Only host left in room
    console.log("Host disconnected, removing room with ID: ", roomOfUser.id);
    exports.removeRoom(roomOfUser.id);
  }

  // Finally log out the user once everything is cleared
  exports.removeUser(user.userID);
  exports.io.to(user.socketID).emit("logout");

  // Make sure timeout doesn't duplicate if we log out manually
  clearTimeout(userTimeouts[userID]);
};

exports.updateUserSocketWithSocketID = (userID, socketID) => {
  this.updateUserSocket(userID, assignUnregisteredSocket(socketID));
};

exports.updateUserSocket = (userID, socket) => {
  let user = users[userID];

  if (user.socketID !== null) {
    // we emit to the previous socket that their socket is now invalid
    console.log("Invalidating previous socket connection");
    exports.io.to(user.socketID).emit("invalidate");
  }

  let prevSocketRooms;
  if (user.socket) {
    prevSocketRooms = user.socket.rooms;
  }

  // we add the socket information as usual
  user.socket = socket;

  if (prevSocketRooms) {
    Object.entries(prevSocketRooms).forEach(([_, roomName]) => {
      user.socket.join(roomName);
    });
  }

  user.socketID = socket.id;
  user.sessionID = socket.handshake.sessionID;
};

exports.findUser = (userID) => users[userID];
exports.getUsers = () => users;

exports.removeUser = (userID) => {
  // Remove user from server
  users = Object.values(users)
    .filter((user) => user.userID !== userID)
    .reduce((res, user) => ({ ...res, [user.userID]: user }), {});
};

exports.userHasRoom = (userID) => {
  return Object.values(rooms).find((room) => room.host === userID);
};

exports.updatePlayerStats = (player, win) => {
  // Sequelize update user info
  sequelize
    .model("user")
    .findOne({
      where: {
        username: player.id,
      },
    })
    .then((user) => {
      user.set("times_played", user.times_played + 1);
      user.set("total_score", Math.round(user.total_score + player.score));
      if (win) user.set("total_wins", user.total_wins + 1);
      user.save();
      // set it locally, too
      exports.setLocalStats(
        player.id,
        user.times_played,
        user.total_score,
        user.total_wins
      );
    })
    .catch((err) => {
      console.error(err);
    });
};

// For displaying stats in userlist in rooms
exports.setLocalStats = (id, timesPlayed, totalScore, totalWins) => {
  let user = users[id];
  let room = rooms[user.currentRoom];
  user.setStats(timesPlayed, totalScore, totalWins);
  // only emit into a room if the user is in one
  if (user.currentRoom != undefined) {
    // update user in room
    let userChange = room.users.findIndex((u) => u.userID == id);
    room.users[userChange] = user.getData();
    exports.io
      .in(user.currentRoom)
      .emit("updatedUserList", { users: room.users, host: room.host });
  }
};

exports.addRoom = (roomName, creator) => {
  rooms[nextRoomID] = new Room(nextRoomID, roomName, creator.getData());
  // Make it so that only people in lobby get emitted of this info
  exports.io.in("lobby").emit("newRoom", rooms[nextRoomID].getData());
  nextRoomID += 1;
};

exports.getRooms = () => {
  return Object.values(rooms).map((room) => room.getData());
};

exports.removeRoom = (id) => {
  // Clean out all users from room
  const room = rooms[id];

  // Remove room from server
  rooms = Object.values(rooms)
    .filter((room) => room.id !== id)
    .reduce((res, room) => ({ ...res, [room.id]: room }), {});

  // Make it so that only people in lobby get emitted of this info
  // Doing Object.values since we want an array of rooms, not the dictionary
  exports.io.in("lobby").emit(
    "updatedRoomList",
    Object.values(rooms).map((room) => room.getData())
  );
};

exports.findRoom = (id) => rooms[id];

const findRoomByHost = (userID) =>
  Object.values(rooms).filter((room) => room.host === userID)[0];

exports.startGame = (roomID, width, height, amplitude) => {
  let room = rooms[roomID];

  room.addGame(
    new Game(
      roomID,
      room.users.map((u) => u.userID),
      width,
      height,
      amplitude
    )
  );
  // Passing roomID to update the status of the game for those in the lobby
  exports.io.in("lobby").emit("activeGame", roomID);
  exports.io.in(roomID).emit("startGame");
};

// called from game.model
// idHp is of structure:
/*
idHp = {
    pList: hashMap with id as key and hp as value
    gameScreen
}
*/
exports.bulletExplosion = (roomID, gameScreen) => {
  exports.io.in(roomID).emit("explosion", gameScreen);
};

// called from game.model with following structure
/**
 * {
            pos: {
                x: this.x,
                y: this.y,
            },
            colour: this.colour,
            velX: this.velX,
            velY: this.velY,
        }
 */
exports.emitShot = (roomID, bullet) => {
  exports.io.in(roomID).emit("newShot", bullet);
};

// id: id of player to move
// called by clients with eventlisteners
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
exports.updatePlayerBools = (roomID, id, playerBools) => {
  if (
    exports.findRoom(roomID) !== undefined &&
    exports.findRoom(roomID).game !== undefined &&
    exports.findRoom(roomID).game != null
  ) {
    exports.findRoom(roomID).game.changeBools(id, playerBools);
  }
};

exports.playerLeft = (roomID, userID) => {
  exports.io.in(roomID).emit("playerLeft", userID);
};

// called from player.js
// structure:
/**
 * {
            id: this.id,
            pos: {
                x: this.x,
                y: this.y,
            },
            shootAngle: this.shootAngle,
            hp: this.hp,
        }
 */
exports.updatePlayer = (roomID, player) => {
  exports.io.in(roomID).emit("updatePlayer", player);
};

/** called from game.model
 * id = playerId of game
 */
exports.gameEnd = (roomID, id) => {
  exports.io.in(roomID).emit("gameOver", id);
  rooms[roomID].activeGame = false;
  exports.io.in("lobby").emit("inactiveGame", roomID);
};

/**
 * Called from game.model after 30 seconds have passed after game ends
 */
exports.destroyGame = (roomID) => {
  if (exports.findRoom(roomID)) exports.findRoom(roomID).game = null;
  exports.io.in(roomID).emit("destroyGame");
};

/**
 * called from game.model
 */
exports.changeTurn = (roomID, currentPlayerIndex) => {
  exports.io.in(roomID).emit("changeTurn", currentPlayerIndex);
};

exports.playerTurnTimerUpdate = (roomID, time) => {
  exports.io.in(roomID).emit("timeChange", time);
};

exports.gameDestroyTimerUpdate = (roomID, time) => {
  exports.io.in(roomID).emit("destroyChange", time);
};
