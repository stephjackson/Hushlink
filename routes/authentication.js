const express = require("express");
const passport = require("passport");
const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const router = express.Router();

//Auth routes using passport live here. Middleware used to ensure proper state.

//Login get and post.
router.get("/login", ensureLoggedOut(), (req, res) => {
  res.render("authentication/login", {
    username: undefined,
    "message": req.flash("error")
  });
});

router.post(
  "/login",
  ensureLoggedOut(),
  passport.authenticate("local-login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
    passReqToCallback: true
  })
);

//Signup get and post.
router.get("/signup", ensureLoggedOut(), (req, res) => {
  res.render("authentication/signup", {
    username: undefined,
    "message": req.flash("error")
  });
});

router.post(
  "/signup",
  ensureLoggedOut(),
  passport.authenticate("local-signup", {
    successRedirect: "/",
    failureRedirect: "/signup",
    failureFlash: true,
    passReqToCallback: true
  })
);

//Logout post.
router.post("/logout", ensureLoggedIn("/login"), (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
