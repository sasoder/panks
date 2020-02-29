const express = require('express');
const model = require('../model.js');

const router = express.Router();
const { sequelize, User } = require('../database');

router.get('/roomList', (req, res) => {
    const rooms = model.getRooms();
    res.status(200).json({ rooms });
});

router.post('/addRoom', (req, res) => {
    model.addRoom(req.body.roomName);
    // TODO: Maybe not always send back ok?
    res.sendStatus(200);
});

// TODO: Add so that only creater of room can remove?
router.post('/removeRoom', (req, res) => {
    model.removeRoom(req.body.roomID);
    // TODO: Maybe not always send back ok?
    res.sendStatus(200);
});

module.exports = { router };