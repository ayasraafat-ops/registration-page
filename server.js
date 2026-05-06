const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Serve static files with 1-day maxAge
app.use(express.static('public', {
  maxAge: '1d'
}));

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format. Must be an array.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus',
        messages: messages,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Safe error logging to prevent Information Exposure
      console.error('OpenRouter API Error:', data?.error?.message || 'Unknown error');
      return res.status(response.status).json({ error: 'Error communicating with AI service.' });
    }

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
