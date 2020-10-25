const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      let token = req.headers.authorization.replace("Bearer ", ""); // le token recu et modifié pour ne pas avoir le "Bearer " au début.
      const usertofind = await User.findOne({ token: token }).select(
        "account email token"
      ); // le user retrouvé grace au token

      if (!usertofind) {
        return res.status(401).json({ error: "Unauthorized" });
      } else {
        req.user = usertofind;

        return next();
      }
    }
  } catch (error) {
    console.error({ message: error });
  }
};

module.exports = isAuthenticated;
