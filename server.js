const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with a maxAge of 1 day for client-side caching
const ONE_DAY = 24 * 60 * 60 * 1000;
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: ONE_DAY
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                // Custom headers using ASCII only
                'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
                'X-Title': 'AI Chat App'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            // Sanitize logging to prevent exposing sensitive fields
            console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
            return res.status(openRouterResponse.status).json({ error: data.error ? data.error.message : 'Error communicating with AI service' });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
