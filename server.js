require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request. 'messages' array is required." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat", // Only ASCII characters
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Qwen 3.6 Plus fallback model based on OpenRouter
                "messages": messages,
                "max_tokens": 1000 // To prevent 402 insufficient credit errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", data.error ? data.error.message : data);
            return res.status(response.status).json({ error: data.error || { message: "An error occurred with the AI service." } });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal server error." } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
