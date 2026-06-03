require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the public directory with a 1-day maxAge cache
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY is not set');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                'X-Title': 'Arabic AI Chat' // Required by OpenRouter
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Using qwen3.6-plus mapped model
                messages: messages,
                max_tokens: 1000 // Prevent 402 insufficient credit errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Log safe, non-sensitive fields to prevent Information Exposure
            console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
            return res.status(response.status).json({
                error: data.error ? data.error.message : 'Error communicating with AI service'
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Internal Server Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
