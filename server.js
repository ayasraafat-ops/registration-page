require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                'X-Title': 'Arabic AI Chat' // Required by OpenRouter
            },
            body: JSON.stringify({
                model: 'qwen/qwen3.6-plus',
                messages: messages,
                max_tokens: 1000 // Restricted per memory guidelines
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize API error logs to avoid information exposure
            console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
            return res.status(response.status).json({ error: 'Failed to communicate with AI API' });
        }

        res.json(data);
    } catch (error) {
        // Sanitize generic error logs
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
