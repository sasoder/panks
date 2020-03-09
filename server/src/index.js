
/*  ------  ***  ------   INITIALIZE CONTEXT   ------  ***  ------  */

// Foundation
const http = require('http');
const express = require('express');
const app = express();

// Socket.io needs the httpServer directly
const httpServer = http.Server(app);
const io = require('socket.io').listen(httpServer); // Creates socket.io app

// Gathering of database
const { sequelize } = require('./database');

// Adding middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



/*  ------  ***  ------   SETUP SESSION   ------  ***  ------  */

const expressSession = require('express-session');

const session = expressSession({
    secret: 'Super secret! Shh! Don\'t tell anyone...',
    resave: true,
    saveUninitialized: true,
});
app.use(session);

const socketIOSession = require('express-socket.io-session')
io.use(socketIOSession(session, {
    autoSave: true,
    saveUninitialized: true,
}));




/*  ------  ***  ------   SERVE CLIENT   ------  ***  ------  */
const path = require('path'); // helper library for resolving relative paths
const publicPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(publicPath));



/*  ------  ***  ------   SETUP ENDPOINTS   ------  ***  ------  */

const auth = require('./controllers/auth.controller.js');
const user = require('./controllers/user.controller.js');
const game = require('./controllers/game.controller.js');

app.use('/api', auth.router);
// All user endpoints require that we have logged in
app.use('/api/user', auth.requireAuth, user.router);
// All game endpoints require that we are in the actual game
app.use('/api/game', auth.requireAuth, auth.requireInGame, game.router);



/*  ------  ***  ------   SETUP MODEL & SOCKET   ------  ***  ------  */

// Initialize model
const model = require('./model.js');
model.init({ io });

// Handle connected socket.io sockets
io.on('connection', (socket) => {
    // This function serves to bind socket.io connections to user models
    if (socket.handshake.session.userID
        && model.findUser(socket.handshake.session.userID) !== undefined
    ) {
        // If the current user already logged in and then reloaded the page
        model.updateUserSocket(socket.handshake.session.userID, socket);
    } else {
        socket.handshake.session.socketID = model.addUnregisteredSocket(socket);
        socket.handshake.session.save((err) => {
            if (err) console.error(err);
            else console.debug(`Saved socketID: ${socket.handshake.session.socketID}`);
        });
    }
});

// HANDLE USER INPUTS IN-GAME
io.on('playerMove', (id, playerBools) => {
    model.updatePlayerBools(playerBools);
});


/*  ------  ***  ------   START SERVER   ------  ***  ------  */

const port = 3000;

// Start server
httpServer.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});