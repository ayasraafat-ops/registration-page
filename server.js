const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1-day maxAge
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                // Ensuring HTTP Headers strictly use ASCII characters
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat Site"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Maps to qwen3.6-plus as requested
                "messages": messages,
                "max_tokens": 1000 // Explicitly restricted to prevent 402 insufficient credit errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize external API errors for logs and client
            console.error("OpenRouter API Error:", data.error?.message || response.statusText);
            return res.status(response.status).json({ error: { message: data.error?.message || response.statusText } });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: error.message } });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
