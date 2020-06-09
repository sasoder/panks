const express = require("express");
const model = require("../model.js");

const router = express.Router();
const { sequelize } = require("../database");

const requireAuth = (req, res, next) => {
  const maybeUser = model.findUser(req.session.userID);
  // "auth" check
  if (maybeUser === undefined) {
    res
      .status(401)
      .send(
        "Unauthorized. Please make sure you are logged in before attempting this action again."
      );
    return;
  }

  // Checking if the origin of the request corresponds to the logged in user
  if (maybeUser.sessionID != req.sessionID) {
    res
      .status(401)
      .send(
        "Unauthorized. Please make sure you are logged in to the correct account before attempting this action again."
      );
    return;
  }

  // Update the timeout clock of the user
  model.updateTimeoutOnUser(req.session.userID);

  next();
};

// for main.js (setting store)
// says if someone is logged in or not
router.get("/isAuthenticated", (req, res) => {
  const maybeUser = model.findUser(req.session.userID);
  let validUsername = maybeUser === undefined ? null : maybeUser.userID;

  res.status(200).json({
    // Return state
    isAuthenticated: validUsername,
  });
});

router.post("/register", (req, res) => {
  console.log(`Registering user: ${req.body.username}`);

  sequelize
    .model("user")
    .create({
      username: req.body.username,
    })
    .then((data) => {
      // Set password field after once we have the object created
      data.setHashPassword(req.body.password);
      data.set("total_score", 0);
      data.set("times_played", 0);
      data.set("total_wins", 0);
      data.save();
    })
    .then(() => {
      // Awaiting save...
      // Status: OK
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error(`Something went wrong during registration: ${err}`);
      // Status: Internal server error
      res.sendStatus(500);
    });
});

router.post("/login", (req, res) => {
  const maybeUser = model.findUser(req.body.username);
  // Only try to login if user isn't already logged in (is inside server as model)
  if (maybeUser === undefined || maybeUser.socket == null) {
    sequelize
      .model("user")
      .findOne({
        where: {
          username: req.body.username,
        },
      })
      .then((user) => {
        // User was not found on server
        if (user == undefined) {
          throw new Error("No user");
        } else {
          console.log(
            `\n\nValid login: ${user.validPassword(req.body.password)}\n\n`
          );
          return user.validPassword(req.body.password);
        }
      })
      .then((correctPassword) => {
        if (correctPassword) {
          console.log("User exists, logging in...");
          // Update the userID of the currently active session

          req.session.userID = req.body.username;
          // Saving session to user;
          req.session.save((err) => {
            if (err) console.error(err);
            else console.debug(`Saved userID: ${req.session.userID}`);
          });

          // Add the user to the model
          model.addUser(req.session.userID, req.session.socketID);

          // check if the user is in any rooms
          let serverUser = model.findUser(req.session.userID);

          // Status: OK
          res.status(200).json({
            userID: req.session.userID,
            room: serverUser.currentRoom,
          });
        } else {
          console.log("Login was invalid");
          // Status: Unauthorized
          res.sendStatus(401);
        }
      })
      .catch((err) => {
        console.log(`Some error occured with login: ${err}`);
        // Status: Not Found
        res.sendStatus(404);
      });
  } else {
    console.log("User is already logged in");
    // Status: Forbidden
    res.sendStatus(403);
  }
});

module.exports = { router, requireAuth };
