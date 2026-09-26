const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

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
      return res.status(400).json({ error: { message: "Invalid messages array." } });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
       return res.status(500).json({ error: { message: "API key is not configured." } });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Chat Application"
      },
      body: JSON.stringify({
        model: "qwen/qwen-plus",
        messages: messages,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
       console.error("OpenRouter API Error:", data.error?.message || "Unknown error");
       return res.status(response.status).json({
          error: { message: data.error?.message || "Failed to communicate with OpenRouter API." }
       });
    }

    res.json(data);

  } catch (error) {
    console.error("Internal Server Error:", error.message);
    res.status(500).json({ error: { message: "An internal server error occurred." } });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
