const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge
app.use(express.static('public', {
  maxAge: '1d'
}));

// API Endpoint for Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-plus',
        messages: messages,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
        let errorDetails = "";
        try {
             const errorData = await response.json();
             errorDetails = errorData.error?.message || JSON.stringify(errorData);
        } catch (e) {
             errorDetails = response.statusText;
        }

      console.error(`OpenRouter API Error: Status ${response.status} - ${errorDetails}`);
      return res.status(response.status).json({ error: { message: `OpenRouter API Error: Status ${response.status} - ${errorDetails}` } });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`Server Error: ${error.message}`);
    res.status(500).json({ error: { message: `Internal Server Error: ${error.message}` } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
