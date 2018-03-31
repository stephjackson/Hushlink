const express = require("express");
const hushRoutes = express.Router();
const moment = require("moment");
const User = require("../models/user");
const Hush = require("../models/hush");
const dns = require('dns');
const { URL } = require('url');

//Middleware to check if a user exists.
hushRoutes.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
});

//Post route for hushes. There would be a package to validate URLs here but none of them worked properly.
//A bespoke solution would be to fire off your own HEAD or GET request but I ran out of time.
hushRoutes.post("/", (req, res, next) => {
  const user = req.user;
  const hushUrl = new URL(req.body.hushUrl);
  console.log(hushUrl.hostname);
  //Searches for the current user.
  User.findOne({ username: user.username }).exec((err, user) => {
    if (err) {
      return;
    }

    //Creates a new hush object.
    const newHush = new Hush({
      user_id: user._id,
      username: user.username,
      hush: req.body.hushUrl
    });

    //Saves the hush in the database.
    newHush.save(err => {
      if (err) {
        res.render("tweets/new", {
          username: user.username,
          errorMessage: err.errors.hush.hushUrl
        });
      } else {
        res.redirect("/");
      }
    });
  });
});

module.exports = hushRoutes;
