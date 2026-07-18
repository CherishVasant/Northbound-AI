const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const UserData = require('../models/UserData');

// PBKDF2 Password Hashing Helpers
// Kept in sync with frontend/lib/auth.ts so both can verify the same records.
const CURRENT_ITERATIONS = 210000; // OWASP guidance for PBKDF2-HMAC-SHA512
const LEGACY_ITERATIONS = 1000;    // what this file used before; no `iterations` field stored

function hashPassword(password, salt, iterations = CURRENT_ITERATIONS) {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
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
      // Previously this returned success without persisting anything, handing
      // out an account that silently vanished. Fail closed instead.
      console.error('[Auth] Database offline; refusing registration.');
      return res.status(503).json({
        error: 'Cannot reach the database right now. Please try again shortly.'
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
    const hashedPassword = hashPassword(password, salt, CURRENT_ITERATIONS);

    // Create UserData entry
    const newUser = new UserData({
      username: formattedUsername,
      email: formattedEmail,
      password: hashedPassword,
      salt: salt,
      iterations: CURRENT_ITERATIONS,
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
      // SECURITY: this previously returned success for ANY username/password
      // whenever the database was unreachable — an authentication bypass on a
      // publicly reachable deployment. Never authenticate without verifying.
      console.error('[Auth] Database offline; refusing login.');
      return res.status(503).json({
        error: 'Cannot reach the database right now. Please try again shortly.'
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

    // Validate Password. Accounts created before the iteration bump have no
    // `iterations` field and must be verified at the legacy cost.
    const usedIterations = user.iterations || LEGACY_ITERATIONS;
    const computedHash = hashPassword(password, user.salt, usedIterations);
    if (!safeEqual(computedHash, user.password)) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Transparently upgrade legacy hashes now that we hold the plaintext.
    if (usedIterations < CURRENT_ITERATIONS) {
      try {
        const newSalt = generateSalt();
        user.salt = newSalt;
        user.password = hashPassword(password, newSalt, CURRENT_ITERATIONS);
        user.iterations = CURRENT_ITERATIONS;
        await user.save({ validateBeforeSave: false });
      } catch (rehashErr) {
        console.error('[Auth] Password rehash failed:', rehashErr);
      }
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
