require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1-day maxAge caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

// Route for chat API
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "Server configuration error: Missing API Key." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                'X-Title': 'Arabic AI Chat' // Only ASCII characters for headers
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000 // To prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize external API errors
            console.error("OpenRouter API Error:", data.error ? data.error.message : response.statusText);
            return res.status(response.status).json({
                error: { message: data.error ? data.error.message : "Error from OpenRouter API." }
            });
        }

        res.json(data);

    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal server error." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
