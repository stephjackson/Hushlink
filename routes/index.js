const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Hush = require("../models/hush");
const moment = require("moment");
const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const back = require("express-back");

//Most of the routes are here.

//Shows all the users.
router.get("/users", (req, res, next) => {
  //Most routes have this text - we set username to undefined to make the navbar dynamically hide in EJS.
  //This isn't particularly dry, and should definitely be fixed.
  username = undefined;

  //They also have this - finds all the users so we can iterate through them to print icons.
  User.find({}).exec((err, users) => {
    if (err) {
      return next(err);
    }

    if (req.user) {
      username = req.user.username;
    }

    //Aggregate is used to pull two random users.
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

// Shows the home page.
router.get("/", function (req, res, next) {
  if (req.user) {
    User.find({}, '_id icon').exec((err, allUsers) => {
      User.findOne({ username: req.user.username }, "_id username").exec(
        (err, user) => {
          username = req.user.username;

          // Gets all the hushes from either the user or the accounts the user is following.
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
                });
            });
        }
      );
    })
    //If there's no user it redirects to the landing page.
  } else {
    res.render("landing", { username: undefined });
  }
});

//Route for showing a profile page.
router.get("/:username", (req, res, next) => {
  User.find({}, '_id icon username').exec((err, allUsers) => {
    //Finds that user.
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

      //Finds all of that user's posts.
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

//Post route for following a user.
router.post("/:username/follow", (req, res) => {
  //Looks up the user to follow.
  User.findOne({ username: req.params.username }).exec((err, follow) => {
    if (err) {
      res.redirect("/" + req.params.username);
      return;
    }

    //Looks up you.
    User.findOne({ username: req.user.username }).exec((err, currentUser) => {
      //Determines if you're following that user.
      var followingIndex = currentUser.following.indexOf(follow._id);

      //This route does double duty - follows if you're not following, unfollows if you are.
      if (followingIndex > -1) {
        currentUser.following.splice(followingIndex, 1);
      } else {
        currentUser.following.push(follow._id);
      }

      //Saves the follow list change.
      currentUser.save(err => {
        req.session.user = currentUser;
        //res.back is an npm package which makes it trivial to jump back to the previous page.
        return res.back();
      });
    });
  });
});

//Route for deleting hushes.
router.post("/:postid/delete", (req, res, next) => {
  User.findOne({ username: req.user.username }).exec((err, follow) => {
    if (err) {
      res.redirect("/" + req.user.username);
      return;
    }

    const id = req.params.postid;

    //Pretty simple - find a specific post by id and remove it.
    Hush.findByIdAndRemove(id, (err, post) => {
      if (err) {
        return next(err);
      }
      return res.back();
    });
  });
});

//Shows all your posts.
router.get("/posts", ensureLoggedIn(), function (req, res, next) {
  User.find({}, '_id icon username').exec((err, allUsers) => {
    //Looks up all your posts.
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

//Shows everyone you're following.
router.get("/following", (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
  }

  username = req.user.username;

  //The following lookup. Also pretty straightforward.
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

//Shows who a given user is following. Similar to the /following route, except with a query to User.
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

//Looks up everyone who follows you. Kind of backwards of following - we look in following in req.user_id
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

//Same thing as /followers with another user.
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

//Route for changing the icon. The fontawesome class is the icon param in the links.
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
