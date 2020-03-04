const express = require('express');
const model = require('../model.js');

const router = express.Router();

router.post('/start', (req, res) => {
    const roomID = req.body.roomID;
    const width = req.body.width;
    const height = req.body.height;
    const amplitude = req.body.amplitude;
    
    // Check if the room has an active game already
    if (model.findRoom(roomID).game !== null) {
        // Status: Forbidden
        res.sendStatus(403);
        return;
    }
    
    // Start the game with given arguments
    model.startGame(roomID, width, height, amplitude);
});