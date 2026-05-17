require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d' // 1 day client-side caching as per memory
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request: 'messages' array is required." } });
        }

        const openrouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterApiKey) {
            return res.status(500).json({ error: { message: "Server configuration error: OpenRouter API key missing." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouterApiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Arabic AI Assistant",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Maps to qwen3.6-plus per memory
                "messages": messages,
                "max_tokens": 1000 // Explicitly restricted to prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Properly sanitize and return API errors per memory
            console.error("OpenRouter API Error:", data.error?.message || response.statusText);
            return res.status(response.status).json({
                error: { message: data.error?.message || `API Error: ${response.status} ${response.statusText}` }
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: error.message || "An unexpected server error occurred." } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
