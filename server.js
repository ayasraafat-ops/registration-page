require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with 1-day caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Invalid messages format. Expected an array.' } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY is not set');
            return res.status(500).json({ error: { message: 'Server configuration error.' } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Optional: Replace with your actual domain
                'X-Title': 'AI Assistant App' // Optional
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data.error?.message || 'Unknown error');
            return res.status(response.status).json({ error: { message: data.error?.message || 'Failed to fetch from OpenRouter' } });
        }

        res.json(data);
    } catch (error) {
        // Sanitize error logging to prevent info exposure
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'An internal server error occurred.' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
