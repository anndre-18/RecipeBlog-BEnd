const bcrypt = require("bcrypt");
const Otp = require("../models/Otp");
const generateOTP = require("../utils/generateOTP");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const createOtpRecord = async ({
  email,
  purpose,
  pendingRegistration = null,
}) => {
  const existing = await Otp.findOne({ email, purpose });

  if (existing?.lastSentAt) {
    const elapsed = Date.now() - new Date(existing.lastSentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      const error = new Error(
        `Please wait ${waitSeconds} seconds before requesting another OTP`
      );
      error.status = 429;
      throw error;
    }
  }

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await Otp.findOneAndUpdate(
    { email, purpose },
    {
      email,
      purpose,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
      pendingRegistration,
    },
    { upsert: true, new: true }
  );

  return otp;
};

const verifyOtpRecord = async ({ email, purpose, otp }) => {
  const record = await Otp.findOne({ email, purpose });

  if (!record) {
    const error = new Error("OTP not found. Please request a new one.");
    error.status = 400;
    throw error;
  }

  if (new Date() > record.expiresAt) {
    await Otp.deleteOne({ _id: record._id });
    const error = new Error("OTP has expired. Please request a new one.");
    error.status = 400;
    throw error;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    const error = new Error(
      "Too many incorrect attempts. Please request a new OTP."
    );
    error.status = 429;
    throw error;
  }

  const isValid = await bcrypt.compare(otp.toString().trim(), record.otpHash);

  if (!isValid) {
    record.attempts += 1;
    await record.save();
    const error = new Error("Invalid OTP");
    error.status = 400;
    throw error;
  }

  const pendingRegistration = record.pendingRegistration;
  await Otp.deleteOne({ _id: record._id });

  return { pendingRegistration };
};

module.exports = { createOtpRecord, verifyOtpRecord };
