const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from the backend folder first
dotenv.config();

// Load environment variables from the frontend folder as fallback
dotenv.config({ path: path.join(__dirname, '../frontend/.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.warn('==================================================');
  console.warn('[Warning] MONGODB_URI is not set in environment.');
  console.warn('Data synchronization with MongoDB is disabled.');
  console.warn('==================================================');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas.'))
    .catch(err => console.error('[Error] MongoDB connection failure:', err));
}

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Sync routes
const syncRouter = require('./routes/sync');
app.use('/api/sync', syncRouter);

// Auth routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API completion endpoint proxying to OpenRouter
app.post('/api/ai', async (req, res) => {
  try {
    const { prompt, systemPrompt, history } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('[Error] OpenRouter API Key is missing from env context.');
      return res.status(500).json({ error: 'OpenRouter API Key not configured on the backend server.' });
    }

    // List of models to try in sequence: primary first, followed by the free models requested by the user
    const modelsToTry = [
      'google/gemini-2.5-flash',
      'nvidia/nemotron-nano-9b-v2',
      'openai/gpt-oss-20b',
      'google/gemma-4-26b-a4b',
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.2-3b-instruct',
      'nousresearch/hermes-3-405b'
    ];

    let lastError = null;
    let replyText = '';
    let success = false;

    for (const model of modelsToTry) {
      try {
        console.log(`[AI] Attempting completion using OpenRouter model: ${model}`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/user/preptrack',
            'X-Title': 'PrepTrack Placement Tracker',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              ...(history || [])
                .filter(msg => msg.content && !msg.content.startsWith('⚠️'))
                .map(msg => ({
                  role: msg.role === 'user' ? 'user' : 'assistant',
                  content: msg.content
                })),
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter returned HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        replyText = data.choices?.[0]?.message?.content || '';
        if (replyText) {
          success = true;
          console.log(`[AI] Success using model: ${model}`);
          break;
        } else {
          throw new Error('Received empty completion choices response.');
        }
      } catch (err) {
        console.warn(`[AI] Model ${model} failed:`, err.message);
        lastError = err;
      }
    }

    if (success) {
      res.json({ text: replyText });
    } else {
      console.error('[Error] All configured OpenRouter models failed.');
      res.status(500).json({ error: lastError ? lastError.message : 'All model completion attempts failed.' });
    }
  } catch (error) {
    console.error('[Error] Server exception during execution:', error);
    res.status(500).json({ error: error.message || 'Internal server error occurred.' });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`PrepTrack Backend Server listening on port ${PORT}`);
  console.log(`Serving endpoints at http://localhost:${PORT}`);
  console.log(`==================================================`);
});
