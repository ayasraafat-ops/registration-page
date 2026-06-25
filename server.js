require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // node-fetch@2

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with 1 day caching
app.use(express.static('public', {
  maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: "Invalid messages array." } });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error("Missing OPENROUTER_API_KEY in environment variables.");
      return res.status(500).json({ error: { message: "Server configuration error." } });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Arabic Chat",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "qwen/qwen-plus",
        "messages": messages,
        "max_tokens": 1000 // Prevent 402 insufficient credit errors
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Sanitize error logging to prevent sensitive information leak
        const errorMessage = data?.error?.message || response.statusText;
        console.error("OpenRouter API Error:", errorMessage);
        return res.status(response.status).json({ error: { message: `OpenRouter API Error: ${errorMessage}` } });
    }

    res.json(data);
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: { message: `Server Error: ${error.message}` } });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
