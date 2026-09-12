const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with a maxAge of 1 day for client-side caching
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "OpenRouter API key is not configured." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                // Ensure ASCII only for X-Title, as per memory instructions
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Arabic AI Chatbot"
            },
            body: JSON.stringify({
                model: "qwen/qwen-plus",
                messages: messages,
                max_tokens: 1000 // Ensure we don't exceed token limits
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Safe logging, sanitize external error response
            console.error("OpenRouter API Error:", data.error?.message || response.statusText);
            return res.status(response.status).json({ error: { message: data.error?.message || "Failed to communicate with the AI model." } });
        }

        res.json(data);

    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: "An internal server error occurred." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
