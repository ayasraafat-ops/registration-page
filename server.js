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

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request payload: 'messages' array is required." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                // Optional: HTTP-Referer and X-Title for OpenRouter rankings
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chat App'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map qwen3.6-plus per memory
                messages: messages,
                max_tokens: 1000 // Prevent 402 insufficient credit errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize external API errors
            console.error('OpenRouter API Error:', data.error ? data.error.message : 'Unknown error');
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : 'Error communicating with AI service' } });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'Internal Server Error' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
