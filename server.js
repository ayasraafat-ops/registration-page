require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key is not configured' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-Title': 'Arabic AI Chat' // ASCII only as per instructions
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Using valid OpenRouter model mapping for qwen3.6-plus
                messages: messages,
                max_tokens: 1000 // Restricted to avoid 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize errors before logging
            console.error('OpenRouter API Error:', {
                status: response.status,
                message: data.error?.message || 'Unknown error'
            });
            return res.status(response.status).json({
                error: data.error?.message || 'Failed to fetch response from AI'
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
