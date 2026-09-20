require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with a maxAge of 1 day
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'qwen/qwen-plus'; // fallback for qwen3.6-plus

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array in request body." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Optional, for OpenRouter tracking
                'X-Title': 'My AI Chat App', // Optional, for OpenRouter tracking (ASCII only)
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                max_tokens: 1000,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data.error ? data.error.message : response.statusText);
            return res.status(response.status).json(data); // Pass the error structure back to client
        }

        res.json(data);

    } catch (error) {
        console.error('Internal Server Error:', error.message);
        res.status(500).json({ error: { message: "Internal server error connecting to the AI service." } });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
