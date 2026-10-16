require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1-day maxAge cache
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request payload. 'messages' array is required." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
             return res.status(500).json({ error: { message: "API key is not configured." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chat App'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000 // restricted max_tokens based on memory constraint
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data.error ? data.error.message : response.statusText);
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : "OpenRouter API error." } });
        }

        res.json(data);

    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: error.message || 'Internal server error' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
