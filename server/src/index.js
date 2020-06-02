/*  ------  ***  ------   INITIALIZE CONTEXT   ------  ***  ------  */

// Helper library for resolving relative paths
const path = require("path");

// Foundation
const http = require("http");
const https = require("https");
const express = require("express");
const app = express();

// Package for reading files (File System)
const fs = require("fs");

// For creating the user tables if they do not exist
const { sequelize } = require("./database");

/*  ------  ***  ------   SETUP DATABASE   ------  ***  ------  */

// Creates the users table if it does not already exist
sequelize.sync();

/*  ------  ***  ------   SETUP SERVER   ------  ***  ------  */

// Creating a HTTPS server with self-signed certificate
const port = 3000;
// const httpsServer = https.createServer({
//     key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
//     cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
//     // TODO: Remove password from file?
//     passphrase: 'vigillarhttps'
//     // TODO: Necessary?
//     // requestCert: false,
//     // rejectUnauthorized: false
// }, app).listen(port, () => {
//     console.log(`Listening on https://localhost:${port}`);
// });

const httpServer = http.createServer(app).listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

// Socket.io needs the httpServer directly
const io = require("socket.io").listen(httpServer); // Creates socket.io app
// const io = require('socket.io').listen(httpsServer); // Creates socket.io app

// Adding middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*  ------  ***  ------   SETUP SESSION   ------  ***  ------  */

const expressSession = require("express-session");

const session = expressSession({
  secret: "Super secret! Shh! Don't tell anyone...",
  // TODO: Necessary to change?
  resave: true,
  // TODO: Necessary to change?
  saveUninitialized: true,
  // "This is typically used in conjuction with short, non-session-length maxAge values to provide a quick
  // timeout of the session data with reduced potentional of it occurring during on going server interactions.""
  rolling: true,
});
app.use(session);

const socketIOSession = require("express-socket.io-session");
io.use(
  socketIOSession(session, {
    autoSave: true,
    saveUninitialized: true,
  })
);

/*  ------  ***  ------   SETUP PREVENTION OF XSS   ------  ***  ------  */

const helmet = require("helmet");
app.use(helmet());

// Code mostly taken from package's description of usage: https://www.npmjs.com/package/helmet-csp

// const csp = require('helmet-csp');
// app.use(csp({
//     directives: {
//         // Any non-declared directives fall under this
//         defaultSrc: ["'self'"],
//         // TODO: Remove 'unsafe-inline'
//         // 'unsafe-inline': Allow for changing and moving script code (unsafe, we don't do that right?)
//         scrtSrc: ["'self'", "'unsafe-eval'"],
//         // TODO: Add boostrap stuff if we use it
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         fontSrc: ["'self'"],
//         imgSrc: ["'self'"],
//         // The sandbox applies a same origin policy, prevents popups, plugins and script execution
//         // is blocked. You can keep the sandbox value empty to keep all restrictions in place, or
//         // add values: 'allow-forms', 'allow-scripts'
//         sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
//         // TODO: Not necessary?
//         reportUri: '/api/csp/report-violation',
//         objectSrc: ["'none'"],
//         // TODO: Not necessary?
//         upgradeInsecureRequests: true,
//     },

//     // This module will detect common mistakes in your directives and throw errors
//     // if it finds any. To disable this, enable "loose mode".
//     loose: false,

//     // Set to true if you only want browsers to report errors, not block them.
//     // You may also set this to a function(req, res) in order to decide dynamically
//     // whether to use reportOnly mode, e.g., to allow for a dynamic kill switch.
//     reportOnly: false,

//     // Set to true if you want to blindly set all headers: Content-Security-Policy,
//     // X-WebKit-CSP, and X-Content-Security-Policy.
//     setAllHeaders: false,

//     // Set to true if you want to disable CSP on Android where it can be buggy.
//     disableAndroid: false,

//     // Set to false if you want to completely disable any user-agent sniffing.
//     // This may make the headers less compatible but it will be much faster.
//     // This defaults to `true`.
//     browserSniff: true
// }));

// app.post(`/api/csp/report-violation`, (req, res) => {
//     console.log("CSP header violation", req.body);
//     // Status: No Content
//     res.sendStatus(204);
// });

/*  ------  ***  ------   SERVE CLIENT   ------  ***  ------  */
const publicPath = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(publicPath));

/*  ------  ***  ------   SETUP ENDPOINTS   ------  ***  ------  */

const auth = require("./controllers/auth.controller.js");
const user = require("./controllers/user.controller.js");
const game = require("./controllers/game.controller.js");

app.use("/api", auth.router);
// All user endpoints require that we have logged in
app.use("/api/user", auth.requireAuth, user.router);
// All game endpoints require that we are in the actual game
app.use("/api/game", auth.requireAuth, game.router);

/*  ------  ***  ------   SETUP MODEL & SOCKET   ------  ***  ------  */

// Initialize model
const model = require("./model.js");
model.init({ io });

// Handle connected socket.io sockets
io.on("connection", (socket) => {
  // Log in the user into the lobby at creation
  socket.join("lobby");
  // This function serves to bind socket.io connections to user models
  if (
    socket.handshake.session.userID &&
    model.findUser(socket.handshake.session.userID) !== undefined
  ) {
    // If the current user already logged in and then reloaded the page
    model.updateUserSocket(socket.handshake.session.userID, socket);
  } else {
    socket.handshake.session.socketID = model.addUnregisteredSocket(socket);
    socket.handshake.session.save((err) => {
      if (err) console.error(err);
      else
        console.debug(`Saved socketID: ${socket.handshake.session.socketID}`);
    });
  }

  // HANDLE USER INPUTS IN-GAME
  socket.on("playerBools", (data) => {
    const { roomID, id, playerBools } = data;
    model.updatePlayerBools(roomID, id, playerBools);
    model.updateTimeoutOnUser(id);
  });

  //
});
