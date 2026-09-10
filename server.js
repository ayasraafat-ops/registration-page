const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array format" } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
             return res.status(500).json({ error: { message: "API key is not configured" } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Arabic AI Chat", // ASCII only
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Maps to qwen3.6-plus as per memory
                "messages": messages,
                "max_tokens": 1000 // Prevent 402 insufficient credit
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize error response, return safe message
            console.error("OpenRouter API Error:", data?.error?.message || response.statusText);
            return res.status(response.status).json({
                 error: { message: data?.error?.message || "Failed to communicate with the AI model." }
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: error.message || "An unexpected internal server error occurred." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
