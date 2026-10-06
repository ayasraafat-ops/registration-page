const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with a maxAge of 1 day
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid or missing 'messages' array in request body." } });
        }

        const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
             return res.status(500).json({ error: { message: "OpenRouter API key is not configured on the server." } });
        }

        const response = await fetch(openRouterUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Update with actual URL when deployed
                'X-Title': 'AI Chatbot Arabic' // Must be ASCII
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Using qwen/qwen-plus for qwen3.6-plus preference
                messages: messages,
                max_tokens: 1000 // Restrict to prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data.error ? data.error.message : data);
            return res.status(response.status).json({ error: data.error || { message: "An error occurred from the AI provider." } });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: "Internal server error." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
