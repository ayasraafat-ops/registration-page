const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

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
      return res.status(400).json({ error: { message: "Invalid messages array format" }});
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: "OPENROUTER_API_KEY is not configured" }});
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Chat Application" // Using ASCII header value
      },
      body: JSON.stringify({
        "model": "qwen/qwen-plus", // Mapping for qwen3.6-plus
        "messages": messages,
        "max_tokens": 1000 // Restriction to avoid insufficient credit errors
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter Error:", data.error ? data.error.message : "Unknown error");
      return res.status(response.status).json({ error: { message: data.error ? data.error.message : "Error connecting to AI service" } });
    }

    res.json(data);
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
