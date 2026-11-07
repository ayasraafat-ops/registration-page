require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request: messages array is required." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "Server misconfiguration: OPENROUTER_API_KEY is not set." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Optional, for OpenRouter rankings
                'X-Title': 'AI Chat Arabic', // Must be ASCII characters
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Only log non-sensitive data
            console.error("OpenRouter API Error:", { status: response.status, message: data.error?.message || data.error || "Unknown error" });
            return res.status(response.status).json({ error: { message: data.error?.message || "Failed to get response from AI." } });
        }

        res.json(data);

    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal server error occurred." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
