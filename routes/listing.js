const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const nodemailer = require("nodemailer");

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

router.get("/search", wrapAsync(listingController.search));

// new get
router.get("/new", isLoggedIn, listingController.renderNewForm);

// add more images
router.post(
  "/:id/addImage",
  isLoggedIn,
  isOwner,
  upload.array("listing[image]", 5),
  wrapAsync(listingController.addImages)
);

// delete images
router.delete(
  "/:id/addImage/:imageId",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.deleteImages)
);

// category route
router.get("/category/:id", listingController.category);

// email route
router
  .route("/:id/contact")
  .get(isLoggedIn, wrapAsync(listingController.renderContactForm))
  .post(isLoggedIn, wrapAsync(listingController.sendEmail));

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

// edit get
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
