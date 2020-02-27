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

// TODO: Add 'create account' route.
// The 'authenticate' route is only supposed to check if the user can login.
router.post('/register', (req, res) => {
    console.log(`registering user: ${req.body.username}`);
    
    // Update the userID of the currently active session
    req.session.userID = req.body.username;

    sequelize.model('user').create({
        username: req.body.username,
        password: req.body.password
    }).then((data) => {
        req.session.save((err) => {
            if (err) console.error(err);
            else console.debug(`Saved userID: ${req.session.userID}`);
        });
        model.addUser(req.body.username, req.session.socketID);
        res.status(200);
        res.json(data.get({ plain: true }));
    }).catch((error) => {
        res.status(500);
        res.json({ error: error, stackError: error.stack });
    });

});

// todo
router.post('/login', (req, res) => {
    const maybeUser = model.user(req.body.username);
    console.log(maybeUser);
    console.log('before check if ass is undefined');
    // check if assistant exists as a model before checking database
    if (maybeUser !== undefined) {
        sequelize.model('assistant').findOne({
            where: {
                username: req.body.username,
            },
        }).then((assistant) => {
            console.log(`\n\nvalid pass test: ${assistant.validPassword(req.body.password)}\n\n`);
            return assistant.validPassword(req.body.password);
        })
            .then((correctPassword) => {
                if (correctPassword) {
                    console.log('Assistant exists, logging in...');
                    // Update the assistantId of the currently active session
                    req.session.userID = maybeUser.username;
                    req.session.save((err) => {
                        if (err) console.error(err);
                        else console.debug(`Saved userID: ${req.session.assistantID}`);
                    });
                    res.sendStatus(200); // Status: OK
                } else {
                    console.log('Password was wrong');
                    res.sendStatus(401); // Status: Unauthorized
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