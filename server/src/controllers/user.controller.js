const express = require('express');
const model = require('../model.js');

const router = express.Router();
const { sequelize } = require('../database');




module.exports = { router };