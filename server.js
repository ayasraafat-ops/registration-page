require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from public with 1 day maxAge
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required.' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured.' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chat App' // Must be ASCII
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map 'qwen3.6-plus' preference
                messages: messages,
                max_tokens: 1000 // Prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Log safely
            console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
            return res.status(response.status).json({
                error: data.error ? data.error.message : 'Failed to fetch response from AI model.'
            });
        }

        res.json(data);

    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
