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

// Serve static files from the 'public' directory with 1-day maxAge
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

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
                // ASCII only headers
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Qwen Arabic Chat"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus",
                "messages": messages,
                "max_tokens": 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API error:", {
                status: response.status,
                message: data.error?.message || "Unknown error"
            });
            return res.status(response.status).json({
                error: { message: data.error?.message || "Error communicating with AI service." }
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Server error:", { message: error.message });
        res.status(500).json({ error: { message: "Internal server error." } });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
