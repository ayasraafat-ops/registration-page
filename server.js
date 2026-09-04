const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "Server configuration error: OPENROUTER_API_KEY is missing." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat Application", // ASCII only
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus",
                "messages": messages,
                "max_tokens": 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", {
                 status: response.status,
                 statusText: response.statusText,
                 error: data.error?.message || "Unknown error"
            });
            return res.status(response.status).json({ error: { message: data.error?.message || "Error communicating with AI service." } });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", { message: error.message });
        res.status(500).json({ error: { message: "Internal server error." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
