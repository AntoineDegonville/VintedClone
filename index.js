// IMPORT DE DOTENV
require("dotenv").config();

// IMPORT DES PACKAGES
const express = require("express");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const app = express();
app.use(formidableMiddleware());
app.use(cors());

// CONNECTION BDD USER
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// // CONNECTION A CLOUDINARY

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// IMPORT ROUTE USER

const userRoute = require("./routes/user");
app.use(userRoute);

// IMPORT ROUTE OFFERS
const publishRoute = require("./routes/offer");
app.use(publishRoute);

// ROUTE ALL
app.all("*", function (req, res) {
  res.json({ message: "Page not found" });
});

// SERVER LISTENER
app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
