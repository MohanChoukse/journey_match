const Listing = require("../models/listing");
const nodemailer = require("nodemailer");

module.exports.index = async (req, res) => {
  let listings = await Listing.find({});
  res.render("listings/index.ejs", { listings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;
  let newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  // console.log(newListing.category);
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.addImages = async (req, res) => {
  let { id } = req.params;
  let uploadedFiles = req.files;

  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing does not exist!");
    res.redirect("/listings");
  }

  const newImages = uploadedFiles.map((file) => {
    return {
      url: file.path,
      filename: file.filename,
    };
  });

  listing.image = listing.image.concat(newImages);
  await listing.save();

  req.flash("success", "New Images added");
  res.redirect(`/listings/${id}`);
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing does not exist!");
    res.redirect("/listings");
  }
  // console.log(listing.reviews);

  const URL = process.env.WEATHER_URL;
  const API_KEY = process.env.WEATHER_API_KEY;
  // weather
  let result;
  try {
    let response = await fetch(
      `${URL}?q=${listing.location}&appid=${API_KEY}&units=metric`
    );
    let jsonResponse = await response.json();
    // console.log(jsonResponse);
    result = {
      city: listing.location,
      temp: jsonResponse.main.temp,
      min: jsonResponse.main.temp_min,
      max: jsonResponse.main.temp_max,
      weatherMain: jsonResponse.weather[0].main,
      weather: jsonResponse.weather[0].description,
      humidity: jsonResponse.main.humidity,
      wind_speed: jsonResponse.wind.speed,
      wind_deg: jsonResponse.wind.deg,
      feelslike: jsonResponse.main.feels_like,
    };
    // console.log(result);
  } catch (err) {
    throw err;
  }

  let now1 = new Date();
  // let hours = 8;
  let hours = now1.getHours();
  const now = new Date();
  const options = {
    timeZone: "Asia/Kolkata", // India Standard Time
    hour12: true, // 24-hour format
    hour: "2-digit",
    minute: "2-digit",
    // second: "2-digit",
  };

  const istTime = now.toLocaleString("en-US", options);
  // console.log(istTime);

  res.render("listings/show.ejs", { listing, result, hours, istTime });
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing does not exist!");
    res.redirect(`/listings/${id}`);
  }
  let originalImgUrl = listing.image[0].url;
  originalImgUrl = originalImgUrl.replace("/upload", "/upload/w_250,h_250");
  res.render("listings/edit.ejs", { listing, originalImgUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }
  await listing.save();
  req.flash("success", "Listing Updated Successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndDelete(id);
  console.log(listing);
  req.flash("success", "Listing Deleted Successfully!");
  res.redirect("/listings");
};

module.exports.deleteImages = async (req, res) => {
  let { id, imageId } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing does not exist!");
    res.redirect("/listings");
  }

  const imageIndex = listing.image.findIndex(
    (img) => img._id.toString() === imageId
  );
  if (imageIndex === -1) {
    req.flash("error", "Image not exist");
    res.redirect(`/listings/${id}`);
  }

  // Remove the image from the listing
  listing.image.splice(imageIndex, 1);

  // Save the updated listing
  await listing.save();

  req.flash("success", "Image removed successfully");
  res.redirect(`/listings/${id}`);
};

module.exports.category = async (req, res) => {
  let { id } = req.params;
  let listings = await Listing.find({ category: { $all: [id] } });
  // console.log(listings);
  if (listings.length != 0) {
    res.locals.success = `Listings find by "${id}" category`;
    res.render("listings/index.ejs", { listings });
  } else {
    req.flash("error", `There is no Listing exist with "${id}" category`);
    res.redirect("/listings");
  }
};

module.exports.search = async (req, res, next) => {
  try {
    let query = req.query.searchQuery;
    // console.log(query);
    // Check if query is null or undefined
    if (!query) {
      req.flash("error", "No match found!!!");
      res.redirect("/listings");
    }

    const listings = await Listing.find({ $text: { $search: query } });
    if (listings.length === 0) {
      req.flash("error", "No match found!!!");
      res.redirect("/listings");
    }

    res.locals.success = `${listings.length} Listings match with your query "${query}"`;
    res.render("listings/index.ejs", { listings });
  } catch (err) {
    next(err);
  }
};

module.exports.renderContactForm = async (req, res) => {
  let { id } = req.params;
  // console.log(id);
  const listing = await Listing.findById(id);
  res.render("listings/contact.ejs", { listing });
};

module.exports.sendEmail = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");
  // console.log(lisitng);

  let currUser = req.user;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.USER_ID,
      pass: process.env.PASSWORD,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    },
  });

  let mailOptions = {
    from: "",
    to: listing.owner.email,
    subject: "For gain more information about listing",
    // text: `Hello ${listing.owner.username},This message is reach you because "${currUser.username}" want more details about your listing. The question he/she send for you is : "${req.body.message}". And you can contact him/her using following mail: ${currUser.email}`,

    html: `
     <html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Aladin&display=swap');
        body {
            margin: 0;
            padding: 0;
            font-family: 'Aladin', cursive, Arial, sans-serif;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #9421ff;
            color: white;
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #e0e0e0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .content p {
            margin: 15px 0;
        }
        .content b {
            color: #ab67eb;
        }
        .footer {
            background-color: #f1f1f1;
            color: #333;
            padding: 15px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer p {
            margin: 0;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100%;
            }
            .content p {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>WanderLust Services</h1>
        </div>
        <div class="content">
            <p>Dear <b>${listing.owner.username}</b>,</p>
            <p>Thank you for using our website. We've some good news for you!</p>
            <p>A user with the username <b>${currUser.username}</b> shows interest in your listing and sent this message for you:</p>
            <p><i>${req.body.message}</i></p>
            <p>You can contact them using this email:</p>
            <p><a href="mailto:${currUser.email}" style="color: #ab67eb; text-decoration: none;">${currUser.email}</a></p>
        </div>
        <div class="footer">
            <p>Best Regards,</p>
            <p>Team WanderLust</p>
        </div>
    </div>
</body>
</html>`,
  };

  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log("Error " + err);
      req.flash("error", "Some error occure!!");
      res.redirect("/listings");
    } else {
      console.log("Email sent successfully");
      req.flash(
        "success",
        "Email sent successfully, Host will contact you via email"
      );
      res.redirect(`/listings/${id}`);
    }
  });
};
