const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with a 1-day maxAge
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
                'HTTP-Referer': 'http://localhost:3000', // Update with your actual domain later
                'X-Title': 'Arabic AI Chat',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Using qwen/qwen-plus as requested for qwen3.6-plus
                messages: messages,
                max_tokens: 1000 // Restricted to prevent 402 errors as per memory
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize error response
            console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
            return res.status(response.status).json({ error: data.error ? data.error.message : 'Error communicating with AI service' });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
