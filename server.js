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
            return res.status(400).json({ error: 'Invalid messages format. Expected an array of messages.' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenRouter API key not configured.' });
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
                model: 'qwen/qwen-plus', // Using valid OpenRouter model mapping for Qwen 3.6+
                messages: messages,
                max_tokens: 1000 // Prevent 402 errors
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let parsedError;
            try {
                parsedError = JSON.parse(errorText);
            } catch (e) {
                parsedError = errorText;
            }

            // Log only safe error info to prevent information exposure
            console.error('OpenRouter API Error:', response.status, typeof parsedError === 'object' ? parsedError.error?.message || 'Unknown object error' : parsedError);

            return res.status(response.status).json({
                error: 'Failed to communicate with the AI model.',
                details: typeof parsedError === 'object' ? parsedError.error?.message : parsedError
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Internal Server Error:', error.message);
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
