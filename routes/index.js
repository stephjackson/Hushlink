const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Hush = require("../models/hush");
const moment = require("moment");
const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");

/* GET home page. */
router.get("/", function(req, res, next) {
  if (req.user) {
    User.findOne({ username: req.user.username }, "_id username").exec(
      (err, user) => {
        username = req.user.username;

        Hush.find({ user_id: { $in: req.user.following } })
          .sort({ created_at: -1 })
          .exec((err, hushes) => {
            res.render("hushes/index", {
              username: username,
              hushes,
              moment,
              session: req.user,
              buttonText: "Unfollow"
            });
          });
      }
    );
  } else {
    res.render("landing", { username: undefined });
  }
});

router.get("/:username", (req, res, next) => {
  User.findOne({ username: req.params.username }).exec((err, user) => {
    if (!user) {
      return next(err);
    }

    username = undefined;

    if (req.user) {
      isFollowing = req.user.following.indexOf(user._id.toString()) > -1;
      username = req.user.username;
    }

    Hush.find({ username: user.username })
      .sort({ created_at: -1 })
      .exec((err, hushes) => {
        if (err) {
          return next(err);
        }
        console.log(username, req.user);
        res.render("profile/show", {
          profileName: user.username,
          username: username,
          hushes,
          moment,
          session: req.user,
          buttonText: isFollowing ? "Unfollow" : "Follow"
        });
      });
  });
});

router.post("/:username/follow", (req, res) => {
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
        res.redirect("/");
      });
    });
  });
});

router.post("/:postid/delete", (req, res, next) => {
  User.findOne({ username: req.user.username }).exec((err, follow) => {
    if (err) {
      res.redirect("/" + req.user.username);
      return;
    }

    const id = req.params.postid;

    Hush.findByIdAndRemove(id, (err, post) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/" + req.user.username);
    });
  });
});

module.exports = router;
