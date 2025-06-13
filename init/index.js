const initData = require("./data.js");
const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("DB is connected");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(
    "mongodb+srv://kartikMain24:Kartikmain24@cluster0.vxdsbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  );
}

let inData = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "662fc34cb38d28e37b668f8c",
  }));
  await Listing.insertMany(initData.data);
  console.log("data is saved");
};

inData();
