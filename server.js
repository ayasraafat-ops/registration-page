require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from 'public' with maxAge 1 day
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: { message: "Invalid messages format" } });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
            console.error("OpenRouter API error:", data.error?.message || "Unknown error");
            return res.status(response.status).json({ error: { message: data.error?.message || "Error communicating with AI provider" } });
        }

        res.json(data);

    } catch (error) {
        console.error("Fetch error:", error.message);
        res.status(500).json({ error: { message: error.message || "Internal server error" } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
