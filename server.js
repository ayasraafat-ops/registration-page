const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const fetch = require('node-fetch');

// Serve static assets with maxAge of 1 day (86400000 ms)
const staticOptions = {
    maxAge: '1d'
};
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

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
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Optional but recommended
                'X-Title': 'Arabic AI Chat' // Optional but recommended
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            console.error('OpenRouter API Error:', data.error?.message || openRouterResponse.statusText);
            return res.status(openRouterResponse.status).json({ error: { message: data.error?.message || "Error communicating with AI service." } });
        }

        res.json(data);
    } catch (error) {
        console.error('Internal Server Error:', error.message);
        res.status(500).json({ error: { message: "An internal server error occurred." } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
