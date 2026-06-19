const nodemailer = require("nodemailer");
require("dotenv").config();

console.log('Email config loaded:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? '***' : 'NOT SET'
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS instead of SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(toEmail, otp) {
  try {
    console.log(`Attempting to send OTP to: ${toEmail}`);
    const result = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Your Login OTP",
      html: `<p>Your one-time code is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });
    console.log('OTP email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    throw error;
  }
}

module.exports = { sendOTP };