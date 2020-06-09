const express = require("express");
const model = require("../model.js");

const router = express.Router();

router.post("/start", (req, res) => {
  const roomID = req.body.roomID;
  const room = model.findRoom(roomID);
  console.log("USERS:", model.getUsers());
  console.log("ROOM USERS:", room.users);
  // Check if the room has an active game already
  if (
    model.findRoom(roomID).game !== null ||
    model.findRoom(roomID).users.length < 2
  ) {
    // Status: Forbidden
    res.sendStatus(403);
    return;
  }

  let roomOwner = model.findUser(room.host);
  if (roomOwner.socket.handshake.sessionID == req.sessionID) {
    const width = req.body.width;
    const height = req.body.height;
    const amplitude = req.body.amplitude;

    // users is a list of the usernames, or rather their id's
    const users = room.users;

    // Start the game with given arguments
    model.startGame(roomID, width, height, amplitude, users);
    res.sendStatus(200);
  } else {
    // We are trying to start a game, hosted by someone else
    // Status: Forbidden
    res.sendStatus(403);
  }
});

// for getting the first gamestate when game is started
router.get("/gameState/:roomID", (req, res) => {
  const roomID = req.params.roomID;

  // Check if the room has an active game already
  if (model.findRoom(roomID).game == null) {
    // Status: not found
    res.sendStatus(404);
    return;
  }

  // send gamestate to the client
  const gameState = model.findRoom(roomID).game.initGameState;
  res.status(200).json({
    gameState,
  });
});

module.exports = { router };
