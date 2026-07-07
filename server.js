const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with a 1-day maxAge
app.use(express.static('public', {
  maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: 'Invalid messages array.' } });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
       return res.status(500).json({ error: { message: 'OpenRouter API key is missing.' } });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Chat App'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus',
        messages: messages,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Sanitize error response, only return the safe message
        const errorMessage = data.error?.message || `API request failed with status ${response.status}`;
        console.error('OpenRouter API Error:', errorMessage);
        return res.status(response.status).json({ error: { message: errorMessage } });
    }

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});