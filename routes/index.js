const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Hush = require("../models/hush");
const moment = require("moment");
const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const back = require("express-back");

/* GET home page. */
router.get("/", function(req, res, next) {
  if (req.user) {
    User.findOne({ username: req.user.username }, "_id username").exec(
      (err, user) => {
        username = req.user.username;

        Hush.find({ user_id: { $in: req.user.following } })
          .sort({ created_at: -1 })
          .exec((err, hushes) => {
            User.aggregate([{ $sample: { size: 2 } }]).exec(
              (err, randomUsers) => {
                res.render("hushes/index", {
                  username: username,
                  hushes,
                  moment,
                  session: req.user,
                  buttonText: "Unfollow",
                  randomUsers
                });
              }
            );
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
        return res.back();
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

router.get("/users", (req, res, next) => {
  username = undefined;

  User.find({}).exec((err, users) => {
    if (err) {
      return next(err);
    }

    if (req.user) {
      username = req.user.username;
    }

    console.log(req.user);

    res.render("profile/find", {
      username: username,
      users: users,
      session: req.user
    });
  });
});

router.get("/following", (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
  }

  username = req.user.username;

  User.find({ _id: { $in: req.user.following } }).exec((err, users) => {
    if (err) {
      console.log(err);
      return next(err);
    }

    User.aggregate([{ $sample: { size: 2 } }]).exec((err, randomUsers) => {
      res.render("profile/find", {
        username: username,
        users: users,
        session: req.user,
        buttonText: "Unfollow",
        randomUsers
      });
    });
  });
});

router.get("/followers", (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
  }

  username = req.user.username;

  User.find({ following: { $in: [req.user._id] } }).exec((err, users) => {
    if (err) {
      console.log(err);
      return next(err);
    }

    User.aggregate([{ $sample: { size: 2 } }]).exec((err, randomUsers) => {
      res.render("profile/find", {
        username: username,
        users: users,
        session: req.user,
        buttonText: "Unfollow",
        randomUsers
      });
    });
  });
});

module.exports = router;
