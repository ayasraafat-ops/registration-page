require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid payload: messages array is required.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Chat' // Must be ASCII
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus',
        messages: messages,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter API error:', data?.error?.message || response.statusText);
      return res.status(response.status).json({ error: data?.error?.message || 'An error occurred while communicating with the AI API.' });
    }

    res.json(data);
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
