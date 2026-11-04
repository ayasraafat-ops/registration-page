const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with caching
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required.' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: API key missing.' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chatbot' // ASCII only
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map to a valid model that satisfies Qwen 3.6-plus requirement
                messages: messages,
                max_tokens: 1000 // Prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data.error?.message || response.statusText);
            return res.status(response.status).json({
                error: { message: data.error?.message || 'Failed to communicate with OpenRouter API.' }
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'An internal server error occurred.' } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
