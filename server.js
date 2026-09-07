const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

const fetch = require('node-fetch');

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array" } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "API Key not configured" } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                // Ensure headers use ASCII characters
                "X-Title": "AI Chat App"
            },
            body: JSON.stringify({
                model: "qwen/qwen-plus",
                messages: messages,
                max_tokens: 1000 // Explicitly limit max_tokens
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", data.error ? data.error.message : "Unknown error");
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : "Error from AI provider" } });
        }

        res.json(data);
    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal server error" } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
