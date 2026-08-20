require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1 day maxAge
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: { message: "API key is not configured." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "X-Title": "Arabic AI App" // ASCII string only
            },
            body: JSON.stringify({
                model: "qwen/qwen-plus", // mapping to qwen3.6-plus as per memory
                messages: messages,
                max_tokens: 1000 // restricted max_tokens to avoid 402 insufficient credit
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", data.error ? data.error.message : "Unknown error");
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : "Failed to fetch response from OpenRouter." } });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: "An internal server error occurred." } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
