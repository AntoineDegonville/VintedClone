const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;

// IMPORT DU MODEL
const User = require("../models/User");

// ROUTE SIGNUP
router.post("/user/signup", async (req, res) => {
  try {
    const email = req.fields.email;
    const username = req.fields.username;
    const phone = req.fields.phone;
    const password = req.fields.password;
    // genere 16 caractères aléatoire.
    const salt = uid2(16);
    // génére un tableau a partir de password+salt, conversion en string avec encBase64.
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);

    const emailtosearch = req.fields.email;

    const usertofind = await User.findOne({ email: emailtosearch });
    if (req.files.picture) {
      // UPLOAD DE L'IMAGE AVEC L'ID DE LA NOUVELLE OFFRE.
      let pictureToUpload = req.files.picture.path;
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: "/vinted/users",
        public_id: username,
      });
      // AJOUT DES INFOS DE L'IMAGE DANS LA NOUVELLE OFFRE
      const avatar = result;
    }

    if (usertofind) {
      res.status(400).json({ message: "Mail already exist" });
    } else if (!req.fields.username) {
      res.status(400).json({ message: "You need a username" });
    } else {
      const newuser = new User({
        email,
        salt,
        hash,
        token,
        account: {
          phone,
          username,
        },
      });

      const answer = {
        token,
        account: {
          phone,
          username,
        },
      };
      console.log(newuser);
      await newuser.save();

      res.status(200).json({ message: "Account created", answer });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: "Ca marche pas.." });
  }
});

// ROUTE LOG IN
router.post("/user/login", async (req, res) => {
  try {
    const usertofind = await User.findOne({ email: req.fields.email });
    const password = req.fields.password;

    const thisisthehash = SHA256(password + usertofind.salt).toString(
      encBase64
    );

    if (usertofind.hash === thisisthehash) {
      const reponse = {
        id: usertofind.id,
        token: usertofind.token,
        account: usertofind.account,
      };
      res.status(200).json({ message: "You're now online", reponse });
    } else {
      res.status(400).json({ message: "something went wrong.." });
    }
  } catch (error) {
    console.error({ message: error });
  }
});

module.exports = router;
