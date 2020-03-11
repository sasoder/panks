const express = require('express');
const model = require('../model.js');

const router = express.Router();
const { sequelize } = require('../database');


const requireAuth = (req, res, next) => {
    const maybeUser = model.findUser(req.session.userID);
    console.log('RequireAuth - Name of logged in user: ' + maybeUser.userID);
    // "auth" check
    if (maybeUser === undefined) {
        res.status(401).send('Unauthorized. Please make sure you are logged in before attempting this action again.');
        return;
    // TODO: TEST COOKIE THEFT DETECTING
    } else if (maybeUser.ip !== req.clientIp) {
        res.status(401).send('Unauthorized. Don\'t try to steal someone else\'s session...');
        return;
    }
    next();
};

// TODO: (see comments)
const requireInGame = (req, res, next) => {

    // Get room with roomID
    // Get game of room with room.game
    // Check if req.session.userID is in array of players inside game.players
    console.log("Passed requireInGame!");

    next();
};

// for main.js (setting store)
router.get('/isAuthenticated', (req, res) => {
    const maybeUser = model.findUser(req.session.userID);
    let validUsername = maybeUser === undefined ? null : maybeUser.userID;
    
    // TODO: TEST COOKIE THEFT DETECTING
    // Ensure that IP of login is the same
    if (validUsername && maybeUser.ip !== req.clientIp) {
        // If username was valid based on existing user but IP is wrong, set invalid again.
        validUsername = null;
    }

    // TODO: Add check for timeout detection
        // TODO: Check if time is greater than some value
        // TODO: Unless player is inside room that has a non-null game in it

    res.status(200).json({
        // Return state
        isAuthenticated: validUsername,
    });
});

router.post('/register', (req, res) => {
    console.log(`registering user: ${req.body.username}`);

    sequelize.model('user').create({
        username: req.body.username
    }).then((data) => {
        // Set password field after once we have the object created
        data.setHashPassword(req.body.password);
        data.set('total_score', 0);
        data.set('times_played', 0);
        data.save();
    }).then( () => {
        // Awaiting save...
        // Status: OK
        res.sendStatus(200);
    }).catch((err) => {
        console.error(`Something went wrong during registration: ${err}`);
        // Status: Internal server error
        res.sendStatus(500);
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
                    // Saving session to user
                    req.session.save((err) => {
                        if (err) console.error(err);
                        else console.debug(`Saved userID: ${req.session.userID}`);
                    });
                    // Add the user to the model
                    // TODO: TEST COOKIE THEFT DETECTING
                    const clientIp = req.clientIp;
                    console.log("\n\n\n\nLOGIN IP: ",clientIp, "\n\n\n\n");
                    const otherIp = req.header('x-forwarded-for') || req.connection.remoteAddress;
                    console.log("\n\n\n\OTHER IP: ",otherIp, "\n\n\n\n");
                    // TODO: TEST COOKIE THEFT DETECTING
                    model.addUser(req.session.userID, clientIp, req.session.socketID);
                    // Status: OK
                    res.status(200).json({
                        userID: req.session.userID
                    });
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


module.exports = { router, requireAuth, requireInGame };