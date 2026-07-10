const transporter = require("../config/mail");

const purposeSubjects = {
  register: "Verify your Recipe Community account",
  login: "Your login verification code",
  reset: "Reset your Recipe Community password",
};

const sendOTPEmail = async (email, otp, purpose = "login") => {
  const subject = purposeSubjects[purpose] || "Your verification code";

  await transporter.sendMail({
    from: `"Tasty Trails" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
  });
};

module.exports = { sendOTPEmail };
