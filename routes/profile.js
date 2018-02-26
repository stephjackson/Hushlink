const express = require("express");
const profileRoutes = express.Router();
const User = require("../models/user");
const Hush = require("../models/hush");
const moment = require("moment");

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
          username: user.username,
          hushes,
          moment
        });
      });
  });
});

module.exports = profileRoutes;
