require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with maxAge
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request: messages must be an array" } });
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Optional but recommended by OpenRouter
                'X-Title': 'AI Website Chat' // Ensure this is ASCII
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Model mapping for qwen3.6-plus
                messages: messages,
                max_tokens: 1000 // Prevent 402 insufficient credit errors
            })
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            // Log only safe fields from the API error
            console.error('OpenRouter API Error:', data.error ? data.error.message : data);
            return res.status(openRouterResponse.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error('Internal Server Error:', error.message);
        res.status(500).json({ error: { message: "An internal server error occurred" } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
