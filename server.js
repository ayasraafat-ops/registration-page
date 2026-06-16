require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from 'public/' directory with 1 day maxAge
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Using the specified OpenRouter Qwen model mapping
                messages: messages,
                max_tokens: 1000, // Restricting to prevent 402 errors
            }),
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            console.error('OpenRouter API Error:', data.error ? data.error.message : data);
            return res.status(openRouterResponse.status).json({
                error: 'Error from OpenRouter API',
                details: data.error ? data.error.message : 'Unknown error'
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
