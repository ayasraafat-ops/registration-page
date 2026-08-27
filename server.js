require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with 1 day maxAge
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
      console.error("Missing OPENROUTER_API_KEY");
      return res.status(500).json({ error: { message: "Server configuration error." } });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // HTTP Headers must be ASCII
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Chat Application"
      },
      body: JSON.stringify({
        model: "qwen/qwen-plus",
        messages: messages,
        max_tokens: 1000 // To prevent 402 errors with current API account
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API error:", data.error ? data.error.message : "Unknown error");
      return res.status(response.status).json({ error: { message: data.error ? data.error.message : "Failed to fetch response from AI." } });
    }

    res.json(data);
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: { message: "Internal server error." } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
