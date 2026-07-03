const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day caching
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array format" } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
             return res.status(500).json({ error: { message: "API key is not configured on the server" } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Qwen Arabic AI Chat", // ASCII only
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen/qwen-plus",
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter Error:", data.error ? data.error.message : data);
            return res.status(response.status).json({
                error: {
                    message: (data.error && data.error.message) ? data.error.message : "An error occurred from OpenRouter API"
                }
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: error.message || "Internal server error" } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
