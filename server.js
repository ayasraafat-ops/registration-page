require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from the public directory with a 1-day maxAge cache
const staticOptions = {
    maxAge: '1d'
};
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

const fetch = require('node-fetch');

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat Application"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // maps to qwen3.6-plus
                "messages": messages,
                "max_tokens": 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", {
                status: response.status,
                error: data.error ? data.error.message : "Unknown error"
            });
            return res.status(response.status).json({ error: data.error || { message: "Unknown error from OpenRouter" } });
        }

        res.json(data);

    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: error.message } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
