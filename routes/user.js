const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const {
  saveRedirectUrl,
  isLoggedIn,
  isProfileOwner,
  validateUser,
} = require("../middleware.js");
const userController = require("../controllers/users.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/signup")
  .get(userController.renderSignUpForm)
  .post(wrapAsync(userController.signUp));

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    userController.login
  );

// get logout
router.get("/logout", isLoggedIn, userController.logout);

// profile
router.get("/profile", isLoggedIn, userController.showProfile);

router.get(
  "/profile/:id/edit",
  isLoggedIn,
  isProfileOwner,
  wrapAsync(userController.renderProfileEditForm)
);

router.put(
  "/profile/:id",
  isLoggedIn,
  isProfileOwner,
  upload.single("user[dp]"),
  validateUser,
  wrapAsync(userController.updateProfile)
);

router.delete(
  "/profile/:id/delete",
  isLoggedIn,
  isProfileOwner,
  wrapAsync(userController.deleteUser)
);

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", `Welcome, ${req.user.username}`);
    res.redirect("/listings");
  }
);

module.exports = router;
