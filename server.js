require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with maxAge of 1 day for client-side caching
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: { message: "Invalid payload. 'messages' array is required." } });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "qwen/qwen-plus", // Maps to qwen3.6-plus effectively
                messages: messages,
                max_tokens: 1000 // Prevent 402 insufficient credit errors with the current API account
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Log sanitized error, not the full response
            console.error("OpenRouter API Error:", data.error?.message || response.statusText);
            return res.status(response.status).json({ error: { message: data.error?.message || "Error communicating with AI service." } });
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
