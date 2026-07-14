require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory with a 1-day maxAge cache
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Update this in production
                'X-Title': 'AI Chatbot UI' // Must be ASCII
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map 'qwen3.6-plus' to a valid OpenRouter model, like 'qwen/qwen-plus' or 'qwen/qwen-turbo'
                messages: messages,
                max_tokens: 1000 // Limit tokens to prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Securely log external API errors
            console.error('OpenRouter API Error:', data.error ? data.error.message : data);
            return res.status(response.status).json({ error: data.error ? data.error.message : 'Error communicating with AI service' });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
