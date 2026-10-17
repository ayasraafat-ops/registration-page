require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: "OpenRouter API key is not configured on the server." } });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Chat Application", // ASCII only as per memory
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen-plus",
        messages: messages,
        max_tokens: 1000 // Restricted to prevent 402 errors
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API Error:", { status: response.status, message: data.error?.message });
      return res.status(response.status).json({
        error: { message: data.error?.message || "Failed to communicate with OpenRouter API." }
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: { message: "An internal server error occurred." } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
