const express = require('express');
const model = require('../model.js');

const router = express.Router();
const { sequelize } = require('../database');


const requireAuth = (req, res, next) => {
    const maybeUser = model.findUser(req.session.userID);
    console.log(maybeUser);
    // "auth" check
    if (maybeUser === undefined) {
        res.status(401).send('Unauthorized. Please make sure you are logged in before attempting this action again.');
        return;
    }

    next();
};

// for main.js (setting store)
router.get('/isAuthenticated', (req, res) => {
    const maybeUser = model.findUser(req.session.userID);
    res.status(200).json({
        isAuthenticated: maybeUser !== undefined,
    });
});

// TODO: Hash password
router.post('/register', (req, res) => {
    console.log(`registering user: ${req.body.username}`);

    sequelize.model('user').create({
        username: req.body.username,
        password: req.body.password
    }).then((data) => {
        req.session.save((err) => {
            if (err) console.error(err);
            else console.debug(`Saved userID: ${req.session.userID}`);
        });
        // Update the userID of the currently active session
        req.session.userID = req.body.username;
        // Add the user to the model
        model.addUser(req.body.username, req.session.socketID);
        // Status: OK
        res.status(200);
        // ? What happens here?
        res.json(data.get({ plain: true }));
    }).catch((error) => {
        // Status: Internal server error
        res.status(500);
        res.json({ error: error, stackError: error.stack });
    });

});

router.post('/login', (req, res) => {
    const maybeUser = model.findUser(req.body.username);
    console.log('Before check if user is logged in: ' + maybeUser);
    // Only try to login if user isn't already logged in (is inside server as model)
    if (maybeUser === undefined) {
        sequelize.model('user').findOne({
            where: {
                username: req.body.username,
            },
        }).then((user) => {
            // User was not found on server
            if (user === undefined) {
                throw new Error('No user');
            } else {
                console.log(`\n\nValid login: ${user.validPassword(req.body.password)}\n\n`);
                return user.validPassword(req.body.password);
            }
        })
            .then((correctPassword) => {
                if (correctPassword) {
                    console.log('User exists, logging in...');
                    // Update the userID of the currently active session
                    req.session.userID = req.body.username;
                    req.session.save((err) => {
                        if (err) console.error(err);
                        else console.debug(`Saved userID: ${req.session.userID}`);
                    });
                    // Update the userID of the currently active session
                    req.session.userID = req.body.username;
                    // Add the user to the model
                    model.addUser(req.body.username, req.session.socketID);
                    // Status: OK
                    res.sendStatus(200);
                } else {
                    console.log('Login was invalid');
                    // Status: Unauthorized
                    res.sendStatus(401);
                }
            })
            .catch((err) => {
                console.log(`Some error occured: ${err}`);
                // Status: Not Found
                res.sendStatus(404);
            });
    } else {
        console.log('User is already logged in');
        // Status: Forbidden
        res.sendStatus(403);
    }
});

module.exports = { router, requireAuth };