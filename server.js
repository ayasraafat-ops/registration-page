require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with 1-day maxAge caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format: 'messages' array is required." } });
        }

        const openrouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterApiKey) {
            return res.status(500).json({ error: { message: "OpenRouter API Key not configured." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openrouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                'X-Title': 'Arabic AI Chat' // Required by OpenRouter
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Using qwen3.6-plus mapping
                messages: messages,
                max_tokens: 1000 // To prevent 402 errors with current API account
            })
        });

        const data = await response.json();

        if (!response.ok) {
             // Sanitize error response: only send safe fields to frontend
             const errorMessage = data.error?.message || "Unknown error from OpenRouter API";
             console.error("OpenRouter API Error:", errorMessage);
             return res.status(response.status).json({ error: { message: errorMessage } });
        }

        res.json(data);

    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal server error: " + error.message } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
