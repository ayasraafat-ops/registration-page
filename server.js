require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

// Setup default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat Website"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Map "qwen3.6-plus" to valid OpenRouter ID
                "messages": messages,
                "max_tokens": 1000 // Limit tokens to prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", {
               status: response.status,
               message: data?.error?.message || 'Unknown Error'
            });
            return res.status(response.status).json({
                error: {
                    message: data?.error?.message || "Error communicating with AI service."
                }
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal server error." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
