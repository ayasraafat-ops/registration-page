require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: { message: "Invalid messages format." } });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: { message: "API key is missing." } });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "X-Title": "AI Chat Application"
            },
            body: JSON.stringify({
                model: "qwen/qwen-plus",
                messages: messages,
                max_tokens: 1000,
            })
        });

        if (!response.ok) {
             const errorData = await response.json();
             console.error("OpenRouter API Error:", errorData?.error?.message || "Unknown error");
             return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: error.message } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});