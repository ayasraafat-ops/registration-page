const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with 1 day maxAge
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request. 'messages' array is required." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "Server configuration error: OpenRouter API key is missing." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // "model": "qwen/qwen-plus", // The user specifically prefers the 'qwen3.6-plus' model, which maps to valid OpenRouter models such as 'qwen/qwen-plus' or 'qwen/qwen-turbo'.
                // "model": "qwen/qwen-turbo",
                "model": "qwen/qwen-plus",
                "messages": messages,
                "max_tokens": 1000,
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Sanitize log for Information Exposure vulnerabilities
            console.error("OpenRouter API Error:", data.error?.message || "Unknown error");
            return res.status(response.status).json({ error: { message: data.error?.message || "Error communicating with OpenRouter API." } });
        }

        res.json(data);
    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ error: { message: error.message || "An unexpected error occurred." } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
