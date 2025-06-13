const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: [
    {
      url: String,
      filename: String,
    },
  ],

  price: {
    type: Number,
  },
  location: {
    type: String,
  },
  country: {
    type: String,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  category: {
    type: String,
    enum: [
      "Select Category",
      "Room",
      "House",
      "Home",
      "Play",
      "Swimming pool",
      "Beach",
      "Building",
      "Farm",
      "Camping",
      "Mountain",
    ],
  },
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing.reviews.length) {
    let res = await Review.deleteMany({ _id: { $in: listing.reviews } });
    console.log(res);
  }
});

// Define text index on title, location, and country fields
listingSchema.index({ title: "text", location: "text", country: "text" });

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
