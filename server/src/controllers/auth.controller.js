const express = require('express');
const model = require('../model.js');

const router = express.Router();
const { sequelize } = require('../database');


const requireAuth = (req, res, next) => {
    const maybeUser = model.findAssistant(req.session.userID);
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

// TODO: Change to that it is a user object instead of assistant
// TODO: Check against database instead of model
router.post('/login', (req, res) => {
    const maybeUser = model.user(req.body.username);
    console.log(maybeUser);
    console.log('before check if user is undefined');
    // check if assistant exists as a model before checking database
    if (maybeUser !== undefined) {
        sequelize.model('user').findOne({
            where: {
                username: req.body.username,
            },
        }).then((user) => {
            console.log(`\n\nvalid pass test: ${user.validPassword(req.body.password)}\n\n`);
            return user.validPassword(req.body.password);
        })
            .then((correctPassword) => {
                if (correctPassword) {
                    req.session.save((err) => {
                        if (err) console.error(err);
                        else console.debug(`Saved userID: ${req.session.assistantID}`);
                    });
                    console.log('User exists, logging in...');
                    // Update the userID of the currently active session
                    req.session.userID = maybeUser.username;
                    // Status: OK
                    res.sendStatus(200);
                } else {
                    console.log('Password was wrong');
                    // Status: Unauthorized
                    res.sendStatus(401);
                }
            })
            .catch((err) => {
                console.log(`Some error occured with saving session object: ${err}`);
                res.sendStatus(400);
            });
    } else {
        console.log('Assistant does not exist');
        res.sendStatus(404); // Status: Not Found
    }
});

module.exports = { router, requireAuth };