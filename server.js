require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                'X-Title': 'AI Chat App' // Optional
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // qwen3.6-plus mapping
                messages: messages,
                max_tokens: 1000 // Prevent 402 errors
            })
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            console.error('OpenRouter API Error:', data.error ? data.error.message : data);
            return res.status(openRouterResponse.status).json({
                error: data.error ? data.error.message : 'An error occurred with the AI service'
            });
        }

        res.json(data);

    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
