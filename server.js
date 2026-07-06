const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Serve static assets from 'public' directory with a maxAge of 1 day
app.use(express.static('public', { maxAge: '1d' }));

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS
app.use(cors());

// POST /api/chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: { message: "API key configuration is missing on the server." } });
        }

        // According to memory, we use qwen/qwen-plus or qwen/qwen-turbo for Qwen 3.6+
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                // ASCII characters only for HTTP headers
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chat App'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000 // restricted max_tokens as per memory to prevent 402
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize response, return only safe technical error details
            console.error("OpenRouter API Error:", data);
            const errorMessage = data.error?.message || "An unknown error occurred from the AI service.";
            return res.status(response.status).json({ error: { message: errorMessage } });
        }

        res.json(data);

    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ error: { message: "An internal server error occurred while processing your request." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
