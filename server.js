require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge caching
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages array' });
        }

        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Update appropriately in production
                'X-Title': 'Arabic AI Chat' // Update appropriately
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map qwen3.6-plus preference to a valid openrouter model
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant. Always communicate clearly. Please respond in Arabic.' },
                    ...messages
                ],
                max_tokens: 1000 // Prevent 402 insufficient credit errors
            })
        });

        const data = await openrouterResponse.json();

        if (!openrouterResponse.ok) {
            // Log only safe fields to prevent Information Exposure
            console.error('OpenRouter API Error:', data.error ? data.error.message : openrouterResponse.statusText);
            return res.status(openrouterResponse.status).json({ error: 'Error communicating with AI service' });
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
