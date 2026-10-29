require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge caching
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000', // Optional, for ranking on openrouter.ai
                'X-Title': 'Arabic AI Chat', // Using ASCII characters
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map to qwen3.6-plus logic
                messages: messages,
                max_tokens: 1000 // Prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
             console.error("OpenRouter API Error:", {
                  status: response.status,
                  error: data.error ? data.error.message : 'Unknown error' // Sanitized log
             });
             return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: 'Internal Server Error' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
