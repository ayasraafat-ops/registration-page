const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public', {
  maxAge: '1d'
}));

// Route for chat completion via OpenRouter API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: 'Invalid messages array provided' } });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000/', // Optional, for OpenRouter rankings
        'X-Title': 'My AI Chat App', // Optional, for OpenRouter rankings, must be ASCII
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus', // Mapping for qwen3.6-plus as requested
        messages: messages,
        max_tokens: 1000 // Explicitly restricted to prevent 402 insufficient credit errors
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter API Error:', data.error ? data.error.message : data);
      return res.status(response.status).json({ error: { message: data.error ? data.error.message : 'API Error' } });
    }

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: { message: 'Internal Server Error' } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
