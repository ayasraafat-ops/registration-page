require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with 1-day caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array in request body" } });
        }

        const openrouterKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterKey) {
            return res.status(500).json({ error: { message: "OpenRouter API Key is missing in environment variables" } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouterKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat",
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
            const errorMsg = data.error?.message || "Unknown error from OpenRouter";
            console.error("OpenRouter API Error:", errorMsg);
            return res.status(response.status).json({ error: { message: errorMsg } });
        }

        res.json(data);
    } catch (error) {
        console.error("Backend server error:", error.message);
        res.status(500).json({ error: { message: "Internal Server Error" } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
