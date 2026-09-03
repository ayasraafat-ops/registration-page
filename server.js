require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge
app.use(express.static('public', {
  maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: 'Invalid messages array' } });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Chat App'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus', // Map qwen3.6-plus to a valid OpenRouter model as per memory
        messages: messages,
        max_tokens: 1000 // Explicit restriction
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter API Error:', {
         status: response.status,
         message: data.error?.message || 'Unknown error'
      });
      return res.status(response.status).json({ error: { message: data.error?.message || 'An error occurred with the OpenRouter API.' } });
    }

    res.json(data);
  } catch (error) {
    console.error('Backend Error:', error.message);
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});