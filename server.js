const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with maxAge of 1 day
app.use(express.static('public', {
  maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: "Invalid messages array." } });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Arabic AI Chat" // Must be ASCII
      },
      body: JSON.stringify({
        model: "qwen/qwen-plus", // Maps to qwen3.6-plus per user request
        messages: messages,
        max_tokens: 1000 // Avoid 402 insufficient credit
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("OpenRouter API Error:", { message: data.error?.message, status: response.status });
        return res.status(response.status).json({ error: { message: data.error?.message || "Failed to fetch response." } });
    }

    res.json(data);
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    res.status(500).json({ error: { message: "An unexpected error occurred." } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
