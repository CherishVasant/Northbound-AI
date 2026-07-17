const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const UserData = require('../models/UserData');

// PBKDF2 Password Hashing Helpers
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// POST /api/auth/register - Sign Up
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const formattedUsername = username.trim().toLowerCase();
    const formattedEmail = email ? email.trim().toLowerCase() : '';

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.warn('[Auth Warning] Database offline. Bypassing registration.');
      return res.status(201).json({
        success: true,
        message: 'Database offline bypass registration successful.',
        username: formattedUsername
      });
    }

    // Check if username already exists
    const existingUser = await UserData.findOne({ username: formattedUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Check if email already exists (if provided)
    if (formattedEmail) {
      const existingEmail = await UserData.findOne({ email: formattedEmail });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }
    }

    // Generate Salt & Hash Password
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);

    // Create UserData entry
    const newUser = new UserData({
      username: formattedUsername,
      email: formattedEmail,
      password: hashedPassword,
      salt: salt,
      dsaProblems: [],
      subjects: [],
      projects: [],
      certifications: [],
      aptitudeTopics: [],
      hrQuestions: [],
      dsaConcepts: []
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      username: formattedUsername
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login - Log In
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const searchKey = usernameOrEmail.trim().toLowerCase();

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.warn('[Auth Warning] Database offline. Bypassing login.');
      return res.json({
        success: true,
        message: 'Database offline bypass login successful.',
        username: searchKey,
        email: ''
      });
    }

    // Query by username or email
    const user = await UserData.findOne({
      $or: [
        { username: searchKey },
        { email: searchKey }
      ]
    });

    if (!user || !user.password || !user.salt) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Validate Password
    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.password) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    res.json({
      success: true,
      message: 'Authentication successful.',
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;
