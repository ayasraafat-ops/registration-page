require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with cache
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: { message: 'Invalid messages array provided' } });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

    if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenRouter API Error:', errorData.error?.message || 'Unknown error');
        return res.status(response.status).json({ error: { message: errorData.error?.message || 'Error communicating with OpenRouter' } });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: { message: 'Internal Server Error' } });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
