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
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d' // Client-side caching as per memory
}));

// API Endpoint for Chat
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Invalid messages format. Expected an array of messages.' } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: 'OpenRouter API key is missing from environment variables.' } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Optional, per OpenRouter docs
                'X-Title': 'AI Chat App' // Optional, per OpenRouter docs
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Mapping for qwen3.6-plus as per memory
                messages: messages,
                max_tokens: 1000 // Explicit restriction as per memory
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Log sanitized error as per memory
            console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : 'Error communicating with OpenRouter API' } });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: error.message || 'Internal server error occurred' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
