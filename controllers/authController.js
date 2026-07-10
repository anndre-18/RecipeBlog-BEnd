const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { createOtpRecord, verifyOtpRecord } = require("../services/otpService");
const { sendOTPEmail } = require("../services/emailService");
const validateEmail = require("../utils/validateEmail");
const validatePassword = require("../utils/validatePassword");
const formatUser = require("../utils/formatUser");
const {
  generateToken,
  generateResetToken,
  JWT_SECRET,
} = require("../utils/generateToken");

const sendOtpEmail = async (email, otp, purpose) => {
  console.log(`[OTP:${purpose}] Sent to ${email}: ${otp}`);
  try {
    await sendOTPEmail(email, otp, purpose);
  } catch (mailErr) {
    console.error("MAIL ERROR:", mailErr);
  }
};

const registerSendOtp = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    const passwordCheck = validatePassword(password, confirmPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const existingUser = await User.findOne({ email: emailCheck.value });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = await createOtpRecord({
      email: emailCheck.value,
      purpose: "register",
      pendingRegistration: {
        name: name.trim(),
        passwordHash,
      },
    });

    await sendOtpEmail(emailCheck.value, otp, "register");
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

const registerVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const existingUser = await User.findOne({ email: emailCheck.value });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const { pendingRegistration } = await verifyOtpRecord({
      email: emailCheck.value,
      purpose: "register",
      otp,
    });

    if (!pendingRegistration?.name || !pendingRegistration?.passwordHash) {
      return res.status(400).json({ message: "Registration session expired" });
    }

    const user = await User.create({
      name: pendingRegistration.name,
      email: emailCheck.value,
      password: pendingRegistration.passwordHash,
      isVerified: true,
    });

    const token = generateToken(user._id);
    res.status(201).json({
      message: "Registration successful",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findOne({ email: emailCheck.value });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    res.status(200).json({ token, user: formatUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginSendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    const user = await User.findOne({ email: emailCheck.value });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    const otp = await createOtpRecord({
      email: emailCheck.value,
      purpose: "login",
    });

    await sendOtpEmail(emailCheck.value, otp, "login");
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

const loginVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findOne({ email: emailCheck.value });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await verifyOtpRecord({
      email: emailCheck.value,
      purpose: "login",
      otp,
    });

    const token = generateToken(user._id);
    res.status(200).json({ token, user: formatUser(user) });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

const forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    const user = await User.findOne({ email: emailCheck.value });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    const otp = await createOtpRecord({
      email: emailCheck.value,
      purpose: "reset",
    });

    await sendOtpEmail(emailCheck.value, otp, "reset");
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findOne({ email: emailCheck.value });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await verifyOtpRecord({
      email: emailCheck.value,
      purpose: "reset",
      otp,
    });

    const resetToken = generateResetToken(emailCheck.value);
    res.status(200).json({
      message: "OTP verified. You can now reset your password.",
      resetToken,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    const passwordCheck = validatePassword(newPassword, confirmPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (decoded.purpose !== "reset" || !decoded.email) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      message: "Password updated successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  registerSendOtp,
  registerVerifyOtp,
  loginWithPassword,
  loginSendOtp,
  loginVerifyOtp,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
};
