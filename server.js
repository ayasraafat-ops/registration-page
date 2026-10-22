require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1-day maxAge
app.use(express.static('public', {
  maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: "Invalid request: messages array is required." } });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: "Server configuration error: Missing API Key." } });
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
        'X-Title': 'AI Web App' // Only ASCII characters
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus',
        messages: messages,
        max_tokens: 1000
      })
    });

    const data = await openRouterResponse.json();

    if (!openRouterResponse.ok) {
        // Handle OpenRouter errors (e.g., 401 User not found for mock API key)
        const errorMessage = data.error?.message || `OpenRouter API error: ${openRouterResponse.statusText}`;
        return res.status(openRouterResponse.status).json({ error: { message: errorMessage } });
    }

    res.json(data);

  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    res.status(500).json({ error: { message: "Internal Server Error while communicating with the AI service." } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});