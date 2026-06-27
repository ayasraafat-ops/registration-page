require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // node-fetch@2

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with maxAge of 1 day
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request: 'messages' array is required." } });
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': `http://localhost:${PORT}`, // Optional, for including your app on openrouter.ai rankings.
                'X-Title': 'AI Website', // Optional. Shows in rankings on openrouter.ai.
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Using qwen/qwen-plus per user memory constraints
                messages: messages,
                max_tokens: 1000 // Prevent 402 insufficient credit errors
            })
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            // Sanitize error logging
            console.error('OpenRouter API Error:', data.error?.message || 'Unknown error');
            return res.status(openRouterResponse.status).json({ error: { message: data.error?.message || 'OpenRouter API Error' } });
        }

        res.json(data);
    } catch (error) {
        // Sanitize error logging
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'Internal Server Error' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
