const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets
app.use(express.static('public', {
  maxAge: '1d' // Cache control
}));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      return res.status(500).json({ error: 'OpenRouter API key is missing' });
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
        'X-Title': encodeURIComponent('Arabic AI Assistant'), // Must be encoded ASCII
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus',
        messages: messages,
        max_tokens: 1000 // Required limit per memory
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API Error:', errorData.error?.message || response.statusText);
      return res.status(response.status).json({
        error: errorData.error?.message || `API request failed with status ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
