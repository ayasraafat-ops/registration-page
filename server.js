const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge cache
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Invalid messages array' } });
        }

        const openrouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterApiKey) {
            console.error('OPENROUTER_API_KEY is missing');
            return res.status(500).json({ error: { message: 'Server configuration error' } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openrouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chatbot'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
             console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
             return res.status(response.status).json({ error: data.error || { message: 'Failed to fetch response from OpenRouter' } });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'Internal Server Error' } });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
