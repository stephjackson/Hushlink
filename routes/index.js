const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Hush = require("../models/hush");
const moment = require("moment");
const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const back = require("express-back");

router.get("/users", (req, res, next) => {
  username = undefined;

  User.find({}).exec((err, users) => {
    if (err) {
      return next(err);
    }

    if (req.user) {
      username = req.user.username;
    }

    User.aggregate([{ $sample: { size: 2 } }]).exec((err, randomUsers) => {
      res.render("profile/find", {
        username: username,
        users: users,
        session: req.user,
        buttonText: "Unfollow",
        randomUsers,
        allUsers: users
      });
    });
  });
});

/* GET home page. */
router.get("/", function (req, res, next) {
  if (req.user) {
    User.find({}, '_id icon').exec((err, allUsers) => {
      User.findOne({ username: req.user.username }, "_id username").exec(
        (err, user) => {
          username = req.user.username;

          // Hush.find({ user_id: { $in: req.user.following } })
          Hush.find({ $or: [{ user_id: { $in: req.user.following } }, { user_id: req.user._id }] })
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
                    randomUsers,
                    allUsers
                  });
                }
              );
            });
        }
      );
    })
  } else {
    res.render("landing", { username: undefined });
  }
});

router.get("/:username", (req, res, next) => {
  User.find({}, '_id icon username').exec((err, allUsers) => {
    User.findOne({ username: req.params.username }).exec((err, user) => {
      if (!user) {
        return next(err);
      }

      var user_id = user._id;
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
          User.aggregate([{ $sample: { size: 2 } }]).exec((err, randomUsers) => {
            res.render("profile/show", {
              username: username,
              user_id: user_id,
              hushes,
              moment,
              session: req.user,
              buttonText: "Unfollow",
              randomUsers,
              profileName: req.params.username,
              allUsers
            });
          });
        });
    });
  });
});

router.post("/:username/follow", (req, res) => {
  User.findOne({ username: req.params.username }).exec((err, follow) => {
    if (err) {
      res.redirect("/" + req.params.username);
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
      return res.back();
    });
  });
});

router.get("/posts", ensureLoggedIn(), function (req, res, next) {
  User.find({}, '_id icon username').exec((err, allUsers) => {
    Hush.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .exec((err, hushes) => {
        User.aggregate([{ $sample: { size: 2 } }]).exec((err, randomUsers) => {
          res.render("hushes/index", {
            username: req.user.username,
            hushes,
            moment,
            session: req.user,
            buttonText: "Unfollow",
            randomUsers,
            allUsers
          });
        });
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
        randomUsers,
        allUsers: users
      });
    });
  });
});

router.get('/:username/following', (req, res, next) => {
  username = undefined;

  if (req.user) {
    username = req.user.username;
  }

  User.findOne({ username: req.params.username }).exec((err, foundUser) => {
    if (err) {
      console.log(err);
      return next(err);
    }

    User.find({ _id: { $in: foundUser.following } }).exec((err, users) => {
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
          randomUsers,
          allUsers: users
        });
      });
    });
  })
})

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
        randomUsers,
        allUsers: users
      });
    });
  });
});

router.get('/:username/followers', (req, res, next) => {
  username = undefined;

  if (req.user) {
    username = req.user.username;
  }

  User.findOne({ username: req.params.username }).exec((err, foundUser) => {
    if (err) {
      console.log(err);
      return next(err);
    }

    User.find({ following: { $in: [foundUser._id] } }).exec((err, users) => {
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
          randomUsers,
          allUsers: users
        });
      });
    });
  })
})

router.post('/:id/:icon/icon', ensureLoggedIn('/login'), (req, res, next) => {

  const updates = {
    icon: req.params.icon
  }

  console.log(updates.icon);

  User.findByIdAndUpdate(req.params.id, updates, (err, user) => {
    if (err) {
      console.log(err);
      return res.back();
    }
    if (!user) {
      return next(new Error('404'));
    }
    return res.back();
  })
})

module.exports = router;
