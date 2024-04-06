const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateJwtToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = { generateJwtToken };
