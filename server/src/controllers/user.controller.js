const express = require("express");
const model = require("../model.js");

const router = express.Router();

// For getting userinfo from database
const { sequelize } = require("../database");

router.get("/roomList", (req, res) => {
  const rooms = model.getRooms();
  res.status(200).json({ rooms });
});

router.post("/addRoom", (req, res) => {
  if (model.userHasRoom(req.session.userID) !== undefined) {
    res.sendStatus(404);
    return;
  }

  // NOTE: No need to check identity, since that is checked in "requireAuth", auth.controller.js
  let user = model.findUser(req.session.userID);

  // Add room since all is fine!
  model.addRoom(req.body.roomName, user);
  // Status: OK
  res.sendStatus(200);
});

router.post("/removeRoom", (req, res) => {
  let roomToRemove = model.findRoom(req.body.roomID);
  let roomOwner = model.findUser(roomToRemove.host);

  if (roomOwner.socket.handshake.sessionID == req.sessionID) {
    model.removeRoom(req.body.roomID);
    // Status: OK
    res.sendStatus(200);
  } else {
    // We are trying to remove a room that belongs to another user
    // Status: Forbidden
    res.sendStatus(403);
  }
});

router.get("/userInfo", (req, res) => {
  sequelize
    .model("user")
    .findOne({
      where: {
        // NOTE: No need to check identity, since that is checked in "requireAuth", auth.controller.js
        username: req.session.userID,
      },
    })
    .then((user) => {
      // User was not found on server
      if (user === undefined) {
        throw new Error("User does not exist. What!?");
      } else {
        // set the statistics for the user model
        model.setLocalStats(
          user.username,
          user.times_played,
          user.total_score,
          user.total_wins
        );
        res.status(200).json({
          timesPlayed: user.times_played,
          totalScore: user.total_score,
          totalWins: user.total_wins,
        });
      }
    });
});

router.get("/:roomID/init", (req, res) => {
  const room = model.findRoom(req.params.roomID);

  // If you are trying to reach a non-existing room
  if (room === undefined) {
    res.sendStatus(404);
    return;
  }

  // NOTE: No need to check identity, since that is checked in "requireAuth", auth.controller.js
  let user = model.findUser(req.session.userID);
  // Join room on refresh
  model.joinRoom(room.id, user);

  // Send response with messages
  res.status(200).json({
    host: room.host,
    name: room.name,
    messages: room.messages,
    users: room.users,
    activeGame: room.game !== null,
  });
});

router.post("/:roomID/leave", (req, res) => {
  // NOTE: No need to check identity, since that is checked in "requireAuth", auth.controller.js
  const user = model.findUser(req.session.userID);

  // Check that the user belongs to that room
  if (user.currentRoom !== parseInt(req.params.roomID)) {
    // Status: Forbidden
    res.sendStatus(403);
    return;
  }

  // Notify that user left
  model.addMessage(user.currentRoom, `${user.userID} left the room :D`);

  // Let user leave room
  model.leaveRoom(req.params.roomID, req.session.userID);

  // Status: OK
  res.sendStatus(200);
});

router.post("/:roomID/message", (req, res) => {
  // NOTE: No need to check identity, since that is checked in "requireAuth", auth.controller.js
  const user = model.findUser(req.session.userID);

  // Check that the user belongs to that room
  if (user.currentRoom !== parseInt(req.params.roomID)) {
    // Status: Forbidden
    res.sendStatus(403);
    return;
  }

  // Send message
  model.addMessage(req.params.roomID, `${user.userID}: ${req.body.message}`);

  // Status: OK
  res.sendStatus(200);
});

router.post("/logout", (req, res) => {
  // NOTE: No need to check identity, since that is checked in "requireAuth", auth.controller.js
  model.logoutUser(req.session.userID);

  // Status: OK
  res.sendStatus(200);
});

module.exports = { router };
