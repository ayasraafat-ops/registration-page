require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with maxAge
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Invalid messages array' } });
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // optional but recommended
                'X-Title': 'Arabic AI Chat' // strictly ASCII
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map qwen3.6-plus to available OpenRouter model
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            console.error('OpenRouter API Error:', data?.error?.message || data);
            return res.status(openRouterResponse.status).json({ error: { message: data?.error?.message || 'Error from AI service' } });
        }

        res.json(data);

    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ error: { message: 'Internal server error' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
