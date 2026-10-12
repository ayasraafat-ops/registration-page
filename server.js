const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with maxAge of 1 day
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request payload. 'messages' array is required." } });
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Web App', // Must be ASCII
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
             console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
             return res.status(response.status).json({ error: { message: data.error ? data.error.message : 'Failed to communicate with OpenRouter API.' } });
        }

        res.json(data);

    } catch (error) {
        console.error('Backend Error:', error.message);
        res.status(500).json({ error: { message: 'An internal server error occurred.' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
