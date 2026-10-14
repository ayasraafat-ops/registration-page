require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with maxAge of 1 day (86400000 ms)
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            console.error("OPENROUTER_API_KEY is missing.");
            return res.status(500).json({ error: { message: "Server misconfiguration. API Key missing." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                // Headers should be ASCII strings to prevent errors
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat Application"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Qwen 3.6 Plus (using qwen-plus)
                "messages": messages,
                "max_tokens": 1000 // Restrict max_tokens to avoid 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize log by avoiding logging sensitive info, safely extract the error from the structure
            console.error("OpenRouter API Error:", data.error?.message || response.statusText);
            return res.status(response.status).json({ error: { message: data.error?.message || "An error occurred with the AI service." } });
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
