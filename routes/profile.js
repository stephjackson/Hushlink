const express = require("express");
const profileRoutes = express.Router();
const User = require("../models/user");
const Hush = require("../models/hush");
const moment = require("moment");
const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");

profileRoutes.get("/:username", (req, res, next) => {
  User.findOne({ username: req.params.username }).exec((err, user) => {
    if (!user) {
      console.log(req.params.username);
      return next(err);
    }

    Hush.find({ username: user.username })
      .sort({ created_at: -1 })
      .exec((err, hushes) => {
        res.render("profile/show", {
          username: username,
          profileName: user.username,
          hushes,
          moment,
          session: req.user,
          buttonText: isFollowing ? "Unfollow" : "Follow"
        });
      });
  });
});

profileRoutes.post("/:username/follow", (req, res) => {
  User.findOne({ username: req.params.username }).exec((err, follow) => {
    if (err) {
      res.redirect("/profile/" + req.params.username);
      return;
    }

    User.findOne({ username: req.user.username }).exec((err, currentUser) => {
      var followingIndex = currentUser.following.indexOf(follow._id);

      if (followingIndex > -1) {
        currentUser.following.splice(followingIndex, 1);
      } else {
        currentUser.following.push(follow._id);
      }

      currentUser.save(err => {
        req.session.user = currentUser;
        res.redirect("/profile/" + req.params.username);
      });
    });
  });
});

module.exports = profileRoutes;
