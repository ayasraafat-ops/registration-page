require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with maxAge
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

// API Endpoint to proxy requests to OpenRouter
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array provided." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Proxying qwen3.6-plus with a valid openrouter model
                "messages": messages,
                "max_tokens": 1000 // Limit to prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Log safe error fields without leaking full objects
            console.error("OpenRouter API Error:", data.error?.message || "Unknown error");
            return res.status(response.status).json({ error: { message: data.error?.message || "Error from OpenRouter API." } });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: error.message || "Internal server error." } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
