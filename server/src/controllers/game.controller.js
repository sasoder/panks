const express = require('express');
const model = require('../model.js');

const router = express.Router();

router.post('/start', (req, res) => {
    const roomID = req.body.roomID;
    const room = model.findRoom(roomID);
    // Check if the room has an active game already
    if (model.findRoom(roomID).game !== null) {
        // Status: Forbidden
        res.sendStatus(403);
        return;
    }

    const width = req.body.width;
    const height = req.body.height;
    const amplitude = req.body.amplitude;

    // users is a list of the usernames, or rather their id's
    const users = room.users
    console.log('these are the users:', users)
    
    
    // Start the game with given arguments
    console.log('starting agme:')
    model.startGame(roomID, width, height, amplitude, users);
});


// for getting the first gamestate when game is started
router.get('/gameState/:roomID', (req, res) => {
    const roomID = req.params.roomID;
    console.log('roomid: ', roomID)
    
    // Check if the room has an active game already
    if (model.findRoom(roomID).game == null) {
        // Status: not found
        res.sendStatus(404);
        return;
    }

    
    // send gamestate to the client
    const gameState = model.findRoom(roomID).game.gameState
    res.status(200).json({
        gameState
    });
});

// for sending out gamestate updates from every player
router.post('/updateGameState/:roomID', (req, res) => {
    const roomID = req.params.roomID;
    console.log('roomid: ', roomID)
    
    // Check if the room has an active game already
    if (model.findRoom(roomID).game !== null) {
        // Status: Forbidden
        res.sendStatus(403);
        return;
    }

    
    // update gamestate
    model.findRoom(roomID).game.gameState = req.body.gameState
    res.sendStatus(200);
});

module.exports = { router };