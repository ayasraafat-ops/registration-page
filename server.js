const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with a maxAge of 1 day for client-side caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Invalid messages array' } });
        }

        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
             return res.status(500).json({ error: { message: 'OpenRouter API key is missing' } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3000', // Required for OpenRouter
                'X-Title': 'Arabic AI Chat', // Must be ASCII
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Using qwen/qwen-plus as mapped from qwen3.6-plus
                messages: messages,
                max_tokens: 1000 // Explicitly restricted
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize error logging
            console.error('OpenRouter API Error:', data.error ? data.error.message : response.statusText);
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : 'Error communicating with OpenRouter' } });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'Internal server error' } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
