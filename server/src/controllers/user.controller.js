const express = require('express');
const model = require('../model.js');

const router = express.Router();

// For getting userinfo from database
const { sequelize } = require('../database');


router.get('/roomList', (req, res) => {
    //console.log('h')
    const rooms = model.getRooms();
    console.log(rooms)
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

router.get('/userInfo', (req, res) => {
    sequelize.model('user').findOne({
        where: {
            username: req.session.userID,
        },
    }).then((user) => {
        // User was not found on server
        if (user === undefined) {
            throw new Error('User does not exist. What!?');
        } else {
            // set the statistics for the user model
            model.setLocalStats(user.username, user.times_played, user.total_score)
            res.status(200).json({
                timesPlayed: user.times_played,
                totalScore: user.total_score
            })
        }
    })
});

router.get('/:roomID/init', (req, res) => {
    const room = model.findRoom(req.params.roomID);

    // If you are trying to reach a non-existing room
    if (room === undefined) {
        res.sendStatus(404);
        return;
    }

    console.log('inited room');

    const user = model.findUser(req.session.userID);
    // Join room on refresh
    model.joinRoom(room.id, user.userID);
    // Only make user join room if they are not already in it
    if (!room.users.includes(req.session.userID)) {
        // Fetch current user

    }

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
    model.logoutUser(req.session.userID);

    // Status: OK
    res.sendStatus(200);
});


module.exports = { router };