const express = require("express");
const hushRoutes = express.Router();
const moment = require("moment");
const User = require("../models/user");
const Hush = require("../models/hush");

hushRoutes.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
});

hushRoutes.get("/", (req, res, next) => {
  User.findOne({ username: req.user.username }, "_id username").exec(
    (err, user) => {
      Hush.find({ user_id: { $in: req.user.following } })
        .sort({ created_at: -1 })
        .exec((err, hushes) => {
          console.log(hushes);
          res.render("hushes/index", {
            username: user.username,
            hushes,
            moment
          });
        });
    }
  );
});

hushRoutes.post("/", (req, res, next) => {
  const user = req.user;

  User.findOne({ username: user.username }).exec((err, user) => {
    if (err) {
      return;
    }

    const newHush = new Hush({
      user_id: user._id,
      username: user.username,
      hush: req.body.hushUrl
    });

    newHush.save(err => {
      if (err) {
        res.render("tweets/new", {
          username: user.username,
          errorMessage: err.errors.hush.hushUrl
        });
      } else {
        res.redirect("/hushes");
      }
    });
  });
});

module.exports = hushRoutes;
