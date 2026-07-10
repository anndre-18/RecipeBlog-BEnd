const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "my_secret";

const generateToken = (userId) => {
  return jwt.sign({ id: userId.toString() }, JWT_SECRET, { expiresIn: "7d" });
};

const generateResetToken = (email) => {
  return jwt.sign({ email, purpose: "reset" }, JWT_SECRET, { expiresIn: "15m" });
};

module.exports = { generateToken, generateResetToken, JWT_SECRET };
