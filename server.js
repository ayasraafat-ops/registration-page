const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1-day maxAge
app.use(express.static('public', {
  maxAge: '1d'
}));

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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus', // Using requested mapped model for qwen3.6-plus
        messages: messages,
        max_tokens: 1000 // Prevent 402 insufficient credit errors
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Log sanitized error
      console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
      return res.status(response.status).json({ error: { message: data.error ? data.error.message : 'Error communicating with OpenRouter' } });
    }

    res.json(data);
  } catch (error) {
    console.error('Internal Server Error:', error.message);
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});