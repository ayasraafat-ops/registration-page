require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files with 1-day maxAge cache
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
                "X-Title": "AI Chat Application", // ASCII only
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Maps to user preferred qwen3.6-plus
                "messages": messages,
                "max_tokens": 1000 // Prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Log safe details, return error
            console.error("OpenRouter API Error:", data.error?.message || "Unknown error");
            return res.status(response.status).json({ error: { message: data.error?.message || "Error from AI provider" } });
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
