const express = require('express');
const model = require('../model.js');

const router = express.Router();


router.get('/roomList', (req, res) => {
    const rooms = model.getRooms();
    res.status(200).json({ rooms });
});


router.post('/addRoom', (req, res) => {
    if (model.userHasRoom(req.session.userID) !== undefined) {
        res.sendStatus(404);
        return;
    }

    console.log('adding room');
    // Add room since all is fine!
    model.addRoom(req.body.roomName, req.session.userID);
    // Status: OK
    res.sendStatus(200);
});


router.post('/removeRoom', (req, res) => {
    model.removeRoom(req.body.roomID);
    // Status: OK
    res.sendStatus(200);
});


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
        creator: room.creator,
        messages: room.messages,
        users: room.users,
        activeGame: room.game !== null,
    });
});


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
    
    // Status: OK
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

    // Status: OK
    res.sendStatus(200);
});


router.post('/logout', (req, res) => {
    const user = model.findUser(req.session.userID);
    const roomOfUser = model.findRoom(req.session.userID);
    console.debug("\n\nRoomofuser: ", roomOfUser, "\n\n");

    // If user is host of a room, change the host
    if (roomOfUser !== undefined) {
        // If host is not alone in room while logging out
        if (roomOfUser.users.length > 1) {
            // Notify that user disconnected
            model.addMessage(user.currentRoom, `${user.userID} disconnected. Changing host to next in command!`);
            // Let user leave room
            model.leaveRoom(roomOfUser.id, req.session.userID);
        } else {
            // Only host left in room
            console.debug('Only host left in room!  ', roomOfUser.id)
            model.removeRoom(roomOfUser.id);
        }
    }

    // Finally log out the user once everything is cleared
    model.removeUser(req.session.userID);
    
    // TODO: Keep sending 200-messages.
    // TODO: -- This messed up the routing thing on logout
    // TODO: -- It didn't interpret resp as "resp.ok"
    res.sendStatus(200);
    // TODO ?: add logout msgs in lobby on logout?
});


module.exports = { router };