require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with a maxAge of 1 day (86400000 ms)
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Invalid messages format' } });
        }

        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) {
            console.error('OPENROUTER_API_KEY is not set');
            return res.status(500).json({ error: { message: 'Server configuration error' } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000,
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', {
                status: response.status,
                error: data.error ? data.error.message : 'Unknown error'
            });
            return res.status(response.status).json({
                error: {
                    message: data.error && data.error.message ? data.error.message : 'Error communicating with AI service'
                }
            });
        }

        res.json(data);

    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'Internal server error' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
