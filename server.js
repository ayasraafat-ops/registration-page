const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public', {
  maxAge: 86400000 // 1 day
}));

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
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus',
        messages: messages,
        max_tokens: 1000,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Sanitize log
      console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
      return res.status(response.status).json({ error: data.error || { message: 'Failed to fetch from OpenRouter API' } });
    }

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
