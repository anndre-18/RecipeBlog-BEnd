const express = require("express");
const {
  registerSendOtp,
  registerVerifyOtp,
  loginWithPassword,
  loginSendOtp,
  loginVerifyOtp,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register/send-otp", registerSendOtp);
router.post("/register/verify", registerVerifyOtp);
router.post("/login", loginWithPassword);
router.post("/login/send-otp", loginSendOtp);
router.post("/login/verify-otp", loginVerifyOtp);
router.post("/forgot-password/send-otp", forgotPasswordSendOtp);
router.post("/forgot-password/verify-otp", forgotPasswordVerifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
