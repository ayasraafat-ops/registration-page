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

// Proxy endpoint for OpenRouter API
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format: 'messages' array is required." } });
        }

        // qwen3.6-plus user preference mapped to available OpenRouter models
        const model = "qwen/qwen-plus";

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000", // Site URL for OpenRouter
                "X-Title": "AI Chat", // Site Title for OpenRouter
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 1000 // Limit tokens to prevent 402 insufficient credit errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Log only safe properties to prevent sensitive info exposure
            console.error("OpenRouter API Error:", data.error?.message || "Unknown error occurred");
            return res.status(response.status).json({
                error: {
                    message: data.error?.message || "An error occurred while communicating with the AI service."
                }
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ error: { message: "Internal server error." } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
