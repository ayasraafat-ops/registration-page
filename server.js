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

// Serve static files from 'public' directory with 1 day maxAge
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
            return res.status(500).json({ error: 'API key not configured on server.' });
        }

        // Prepare request payload for OpenRouter
        const payload = {
            model: 'qwen/qwen-plus', // Map 'qwen3.6-plus' preference to the valid OpenRouter model
            messages: messages,
            max_tokens: 1000 // Explicit restriction to prevent 402 insufficient credit errors
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                // Custom headers like X-Title must be strictly ASCII to prevent illegal header errors
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chatbot Arabic'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle and sanitize errors (avoid sending full error objects directly)
            console.error('OpenRouter API Error:', data.error ? data.error.message : data);

            // Check for expected mock/invalid key error (401)
            if (response.status === 401) {
                 return res.status(401).json({ error: data.error?.message || 'Invalid API key or unauthorized.' });
            }

            return res.status(response.status).json({
                error: data.error?.message || 'Failed to communicate with the AI model.'
            });
        }

        // Successfully got a response
        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Internal server error processing the chat request.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});