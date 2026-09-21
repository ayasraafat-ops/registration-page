const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid payload: 'messages' must be an array." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "OPENROUTER_API_KEY is not configured on the server." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                // Adding arbitrary ASCII titles just in case, skipping Arabic to avoid illegal header errors
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chatbot'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map qwen3.6-plus preference to a valid openrouter model
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data.error?.message || response.statusText);
            return res.status(response.status).json({ error: { message: data.error?.message || response.statusText } });
        }

        res.json(data);
    } catch (error) {
        console.error('Internal Server Error:', error.message);
        res.status(500).json({ error: { message: error.message } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
