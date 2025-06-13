const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");

module.exports.renderSignUpForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.signUp = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    let newUser = new User({
      email: email,
      username: username,
    });
    let regUser = await User.register(newUser, password);
    // console.log(regUser);
    req.login(regUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome, Your account is created!");
      res.redirect("/listings");
    });
    // res.redirect("/listings");
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", `Welcome back ${req.body.username}`);
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You logged out successfully!");
    res.redirect("/listings");
  });
};

module.exports.showProfile = (req, res) => {
  res.render("users/profile.ejs");
};

module.exports.renderProfileEditForm = async (req, res) => {
  let { id } = req.params;
  let user = await User.findById(id);
  let originalDpUrl = user.dp.url;
  res.render("users/editProfile.ejs", { user, originalDpUrl });
};

module.exports.updateProfile = async (req, res) => {
  let { id } = req.params;
  let user = await User.findByIdAndUpdate(id, { ...req.body.user });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    user.dp = { url, filename };
  }
  await user.save();
  req.flash("success", "Profile Updated Successfully!");
  res.redirect(`/profile`);
};

module.exports.deleteUser = async (req, res) => {
  try {
    let { id } = req.params;
    await Listing.deleteMany({ owner: id });
    await Review.deleteMany({ author: id });
    await User.findByIdAndDelete(id);

    req.flash("error", "Your profile deleted successfully");
    res.redirect("/listings");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/listings");
  }
};
