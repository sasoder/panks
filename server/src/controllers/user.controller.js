const express = require('express');
const model = require('../model.js');

const router = express.Router();

router.get('/roomList', (req, res) => {
    const rooms = model.getRooms();
    res.status(200).json({ rooms });
});

router.post('/addRoom', (req, res) => {
    let addedRoom = model.addRoom(req.body.roomName, req.session.userID);
    // TODO send message if room was added or not
});

// TODO: Add so that only creater of room can remove?
router.post('/removeRoom', (req, res) => {
    model.removeRoom(req.body.roomID);
});

// TODO: Set up join endpoint
// TODO: Add current user to the array of users in room
router.get('/:roomID/init', (req, res) => {
    const room = model.findRoom(req.params.roomID);
    if (room === undefined) {
      res.sendStatus(404);
      return;
    }

    // Fetch current user
    const user = model.findUser(req.session.userID);

    // Add the user to the room's user list 
    model.joinRoom(room.id, user.userID);
  
    // Send join message
    model.addMessage(user.currentRoom, `${user.userID} joined the room!`);
  
    // Send response with messages
    res.status(200).json({
      list: room.messages,
      users: room.users,
    });
});

// TODO: Set up 'leave' endpoint.
router.post('/:roomID/leave', (req, res) => {
    const user = model.findUser(req.session.userID);
    if (user.currentRoom !== parseInt(req.params.roomID)) {
        // Status: Forbidden
        res.sendStatus(403);
        return;
    }

    // Notify that user left
    model.addMessage(user.currentRoom, `${user.userID} left the room :D`);

    // Let user leave room
    model.leaveRoom(req.params.roomID, req.session.userID);
    
    res.sendStatus(200);
});


router.post('/:roomID/message', (req, res) => {
    const user = model.findUser(req.session.userID);
    console.log("User ID: " + req.session.userID);
    console.log("Params, Room: " + req.params.roomID);
    console.log("User, currentroom: " + user.currentRoom);
    if (user.currentRoom !== parseInt(req.params.roomID)) {
        // Status: Forbidden
        res.sendStatus(403);
        return;
    }

    // Send message
    model.addMessage(req.params.roomID, `${user.userID}: ${req.body.message}`);
  
    res.sendStatus(200);
  });

module.exports = { router };