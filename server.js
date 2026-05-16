const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day caching
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array format" } });
        }

        const openRouterKey = process.env.OPENROUTER_API_KEY;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Arabic AI Chat',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map to qwen3.6-plus
                messages: messages,
                max_tokens: 1000 // Prevent insufficient credit error
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter Error:', data.error ? data.error.message : data);
            return res.status(response.status).json({
                error: { message: data.error && data.error.message ? data.error.message : 'Error communicating with AI service' }
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({
            error: { message: error.message || 'Internal server error' }
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
