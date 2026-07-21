require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge for client-side caching
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid payload: 'messages' array is required." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                'X-Title': 'AI Chat App' // Must be ASCII characters
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Mapping 'qwen3.6-plus' to 'qwen/qwen-plus' as per OpenRouter available models
                messages: messages,
                max_tokens: 1000 // Required to prevent 402 insufficient credit errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown Error');
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : 'OpenRouter API Error' } });
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
