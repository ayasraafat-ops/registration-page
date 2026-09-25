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
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                // Ensure custom header values use only ASCII characters
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chat Application'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000 // Ensure we don't exceed credit limits
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle error response from OpenRouter
            console.error('OpenRouter API Error:', data.error ? data.error.message : data);
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : "Failed to fetch response from AI provider." } });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'Internal server error.' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
