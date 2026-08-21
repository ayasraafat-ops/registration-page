const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge caching
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages format. Expected an array." }});
        }

        const openrouterKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterKey) {
            return res.status(500).json({ error: { message: "OpenRouter API Key is not configured." }});
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouterKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Arabic AI Chat", // ASCII only
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus",
                "messages": messages,
                "max_tokens": 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter Error:", data.error ? data.error.message : response.statusText);
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : response.statusText }});
        }

        res.json(data);
    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: error.message } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
