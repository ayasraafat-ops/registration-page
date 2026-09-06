const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with 1-day caching
app.use(express.static('public', {
  maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: "Invalid messages array." } });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: "API Key not configured." } });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Chat Arabic'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus',
        messages: messages,
        max_tokens: 1000,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API Error:", {
          status: response.status,
          message: data.error?.message || "Unknown Error"
      });
      return res.status(response.status).json({ error: { message: data.error?.message || "API Error" } });
    }

    res.json(data);
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
