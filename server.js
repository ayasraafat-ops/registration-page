const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1-day cache
app.use(express.static('public', {
  maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: "Invalid request: 'messages' array is required." } });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error("Missing OpenRouter API Key");
        return res.status(500).json({ error: { message: "Server configuration error." } });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': encodeURIComponent('AI Chat App'), // ASCII only, URL encoded
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus', // Using valid openrouter qwen model
        messages: messages,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        // Sanitize error logging
        console.error("OpenRouter API Error:", data.error ? data.error.message : response.statusText);
        return res.status(response.status).json({ error: { message: data.error ? data.error.message : "Failed to fetch response from AI." } });
    }

    res.json(data);

  } catch (error) {
    console.error("Internal Server Error:", error.message);
    res.status(500).json({ error: { message: error.message || "An unexpected error occurred." } });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
