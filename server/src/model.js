/* jslint node: true */

'use strict';

// a lobby has rooms
const Lobby = require('./models/lobby.model');
const User = require('./models/user.model');

const Room = require('./models/room.model');
const Game = require('./models/game.model');

const { sequelize } = require('./database');

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
  let user = users[userID];
  // Set the current room of the user
  console.log(user)
  user.currentRoom = roomID;
  // Join the right socket.io room
  user.socket.leave('lobby');
  user.socket.join(roomID);
  // Add the user to the corresponding room
  rooms[roomID].addUser(userID);
  
  // Updated Rooms with users
  exports.io.in('lobby').emit('updatedRoomList', Object.values(rooms));
  exports.io.in(roomID).emit('updatedUserList', room.users);
  console.log("Added user to room ", roomID, " with ID: ", userID);
};

exports.leaveRoom = (roomID, userID) => {
  let user = users[userID]
  let room = rooms[roomID]
  // User leaves the game upon leaving the room
  if(room.game != null) room.game.leaveGame(userID)
  // Set the current room of the user to null
  user.currentRoom = null;
  // Join the right socket.io room
  user.socket.leave(roomID);
  user.socket.join('lobby');
  // Remove the user of the corresponding room
  room.removeUser(userID);

  // Updated Rooms with users
  exports.io.in('lobby').emit('updatedRoomList', Object.values(rooms));
  exports.io.in(roomID).emit('updatedUserList', rooms[roomID].users);
  console.log("User left room ", roomID, " with ID: ", userID);
};

// TODO: TEST COOKIE THEFT DETECTING
exports.addUser = (userID, ip, socketID = undefined) => {
  // TODO: TEST COOKIE THEFT DETECTING
  users[userID] = new User(userID, ip);
  if (socketID !== undefined) {
    users[userID].socket = assignUnregisteredSocket(socketID);
  }
  // Log in the user into the lobby at creation
  users[userID].socket.join('lobby');

  // Set up timeout for user
  // userTimeouts[userID] = setTimeout(() => { exports.logoutUser(userID) }, 1000 * 10); // 10 sec (debugging)
  userTimeouts[userID] = setTimeout(() => { exports.logoutUser(userID) }, 1000 * 60 * 10); // 10 min
};

exports.updateTimeoutOnUser = (userID) => {
  // Stop current timeout
  clearTimeout(userTimeouts[userID]);
  // Reset timeout
  // userTimeouts[userID] = setTimeout(() => { exports.logoutUser(userID) }, 1000 * 10); // 10 sec (debugging)
  userTimeouts[userID] = setTimeout(() => { exports.logoutUser(userID) }, 1000 * 60 * 10); // 10 min
}

exports.logoutUser = (userID) => {
  console.log("USERS: ",users);
  console.log("Trying to log out: ",userID);
  const user = users[userID];
  const roomOfUser = findRoomByCreator(userID);
  console.debug("\n\nRoomofuser: ", roomOfUser, "\n\n");

  console.log("Current Room: ", user.currentRoom);
  if (user.currentRoom !== null) {
    // Notify that user disconnected
    exports.addMessage(user.currentRoom, `${user.userID} disconnected.`);
    // Let user leave room
    exports.leaveRoom(user.currentRoom, user.userID);
  }

  // If user is host of a room, change the host
  if (roomOfUser !== undefined) {
      // Only host left in room
      console.log('Host disconnected, removing room with ID: ', roomOfUser.id)
      exports.removeRoom(roomOfUser.id);
  }

  // Finally log out the user once everything is cleared
  exports.removeUser(user.userID);
  exports.io.to(`${user.socket.id}`).emit('logout');
  
  // Make sure timeout doesn't duplicate if we log out manually
  clearTimeout(userTimeouts[userID]);
}


exports.updateUserSocket = (userID, socket) => {
  users[userID].socket = socket;
};

exports.findUser = (userID) => users[userID];


exports.removeUser = (userID) => {
  // Remove user from server
  users = Object.values(users)
  .filter((user) => user.userID !== userID)
  .reduce((res, user) => ({ ...res, [user.userID]: user }), {});
};

exports.userHasRoom = (userID) => {
  return Object.values(rooms).find(room => room.creator === userID);
}

exports.updatePlayerStats = (players) => {

    // Sequelize update user info

    players.forEach(p => {
      sequelize.model('user').findOne({
        where: {
            username: p.id,
        },
      }).then((user) => {
        user.set('times_played', user.times_played + 1);
        user.set('total_score', user.total_score + p.score);
        user.save();
      }).catch((err) => {
        console.error(err);
      });
    });
}

// For displaying stats in userlist in rooms
exports.setLocalStats = (id, timesPlayed, totalScore) => {
    let user = users[id]
    user.setStats(timesPlayed, totalScore)
}


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
    exports.leaveRoom(id, userID);
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


const findRoomByCreator = (userID) => Object.values(rooms).filter((room) => room.creator === userID)[0];


exports.startGame = (roomID, width, height, amplitude) => {
  console.log('startgame model')

  let room = rooms[roomID];

  room.addGame(new Game(roomID, room.users, width, height, amplitude));
  exports.io.in(roomID).emit('startGame');
}

// called from game.model
// idHp is of structure:
/*
idHp = {
    pList: hashMap with id as key and hp as value
    gameScreen
}
*/
exports.bulletExplosion = (roomID, gameScreen) => {
  exports.io.in(roomID).emit('explosion', gameScreen)
}



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
  exports.io.in(roomID).emit('newShot', bullet)
}

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
    if(this.findRoom(roomID) !== undefined) {
        exports.findRoom(roomID).game.changeBools(id, playerBools);
    }
}

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
  exports.io.in(roomID).emit('updatePlayer', player)
}

/** called from game.model
 * id = playerId of game
 */
exports.gameEnd = (roomID, id) => {
  exports.io.in(roomID).emit('gameOver', id)
}

/**
 * Called from game.model after 30 seconds have passed after game ends
 */
exports.destroyGame = (roomID) => {
    exports.findRoom(roomID).game = null
    exports.io.in(roomID).emit('destroyGame')
}

/**
 * called from game.model
 */
exports.changeTurn = (roomID, currentPlayerIndex) => {
  exports.io.in(roomID).emit('changeTurn', currentPlayerIndex);
}