const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve static files from the 'public' directory with a maxAge of 1 day
app.use(express.static('public', { maxAge: 86400000 }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) {
            console.error("Missing OPENROUTER_API_KEY environment variable.");
            return res.status(500).json({ error: { message: "Internal server error. API key not configured." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                // Custom headers strictly using ASCII characters
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chatbot'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000 // Limit tokens to prevent 402 insufficient credit errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data.error ? data.error.message : response.statusText);
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : response.statusText } });
        }

        res.json(data);

    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'An internal server error occurred.' } });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
