require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with maxAge of 1 day
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const messages = req.body.messages;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                'X-Title': 'AI Chatbot' // ASCII characters only to avoid header errors
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // user requested qwen3.6-plus, mapped to valid openrouter model
                messages: messages,
                max_tokens: 1000 // Limit tokens to prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API error:', data.error ? data.error.message : response.statusText);
            return res.status(response.status).json({ error: data.error ? data.error.message : 'API Error' });
        }

        res.json(data);
    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
