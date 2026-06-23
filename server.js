require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with 1 day maxAge for client-side caching
const maxAge = 24 * 60 * 60 * 1000; // 1 day in milliseconds
app.use(express.static('public', { maxAge }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request. 'messages' array is required." } });
        }

        const openrouterKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterKey) {
            console.error("OPENROUTER_API_KEY is not configured.");
            return res.status(500).json({ error: { message: "Server configuration error. API key missing." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouterKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen/qwen-plus",
                messages: messages,
                max_tokens: 1000,
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data?.error?.message || "An unknown error occurred from OpenRouter API.";
            console.error("OpenRouter API Error:", errorMsg); // Sanitized logging
            return res.status(response.status).json({ error: { message: errorMsg } });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: error.message } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
