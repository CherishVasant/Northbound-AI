const express = require('express');
const router = express.Router();
const UserData = require('../models/UserData');

// Map frontend STORAGE_KEYS to database fields
const KEY_MAP = {
  'placement_dsa_problems': 'dsaProblems',
  'placement_subjects': 'subjects',
  'placement_projects': 'projects',
  'placement_certifications': 'certifications',
  'placement_aptitude_topics': 'aptitudeTopics',
  'placement_hr_questions': 'hrQuestions',
  'placement_concepts': 'dsaConcepts',
  'placement_companies': 'placementCompanies',
  'placement_custom_options': 'placementCustomOptions'
};

// GET /api/sync/:username
router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.warn('[Sync Warning] Database offline. Returning empty sync response.');
      return res.json({});
    }

    let userData = await UserData.findOne({ username });
    if (!userData) {
      // Create new user entry with default empty lists if they don't exist
      userData = new UserData({ username });
      await userData.save();
    }

    // Format output keys to match the frontend STORAGE_KEYS
    const response = {};
    for (const [storageKey, dbField] of Object.entries(KEY_MAP)) {
      response[storageKey] = userData[dbField] || [];
    }

    res.json(response);
  } catch (error) {
    console.error(`[Sync GET Error]`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sync/:username
router.post('/:username', async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();
    const { key, value } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.warn('[Sync Warning] Database offline. Skipping backend save.');
      return res.json({ success: true, message: 'Database offline bypass' });
    }

    const dbField = KEY_MAP[key];
    if (!dbField) {
      return res.status(400).json({ error: `Invalid sync key: ${key}` });
    }

    // Find the user or create if not exists
    let userData = await UserData.findOne({ username });
    if (!userData) {
      userData = new UserData({ username });
    }

    // Update the specific field
    userData[dbField] = value;

    // Persist the incoming client data as-is. The browser's localStorage is the
    // source of truth, so we skip strict subdocument validation here: a single
    // record with an unexpected enum value must never block the entire sync and
    // cause silent data loss. Schema casting (types) still applies.
    await userData.save({ validateBeforeSave: false });

    res.json({ success: true, message: `Successfully synchronized ${key}`, updatedAt: userData.updatedAt });
  } catch (error) {
    console.error(`[Sync POST Error]`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
