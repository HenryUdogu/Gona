const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOTP } = require('../utils/mailer');
const passport = require('passport');

const otpStore = {};

// ✅ REGISTER — create account then send OTP (no token yet)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });

    // Generate OTP and store it
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore[email] = { otp, expires };

    // Send OTP email
    await sendOTP(email, otp);

    // No token yet — wait for OTP verification
    res.status(201).json({ message: 'Account created. OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

// Google callback — issue JWT and redirect to frontend
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const user = { id: req.user._id, name: req.user.name, email: req.user.email };

    // Send token to frontend via URL param — frontend picks it up
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);


// LOGIN — verify password then send OTP (no token yet)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate OTP and store it
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore[email] = { otp, expires };

    // Send OTP email — only once
    await sendOTP(email, otp);

    res.json({ message: 'OTP sent to your email. Please verify to continue.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ VERIFY OTP — works for both login and register
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ message: 'No OTP found. Please try again.' });
    }

    if (Date.now() > record.expires) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP has expired. Please try again.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Try again.' });
    }

    delete otpStore[email];

    const user = await User.findOne({ email });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;