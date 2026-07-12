const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day caching
app.use(express.static('public', {
  maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: { message: 'Invalid messages array' } });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Arabic AI Chat' // ASCII only as per memory
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus', // Map qwen3.6-plus per memory
        messages: messages,
        max_tokens: 1000 // Prevent 402 errors per memory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter API Error:', data?.error?.message || 'Unknown error');
      return res.status(response.status).json({ error: { message: data?.error?.message || 'Error communicating with AI service' } });
    }

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: { message: 'Internal Server Error' } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
