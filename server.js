const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from the public directory with caching configured for 1 day
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request. 'messages' array is required." } });
        }

        const openrouterApiKey = process.env.OPENROUTER_API_KEY;

        if (!openrouterApiKey) {
            return res.status(500).json({ error: { message: "OpenRouter API key is missing on the server." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouterApiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "ChatApp",
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
             console.error("OpenRouter API Error:", data.error ? data.error.message : data);
             return res.status(response.status).json({ error: { message: data.error ? data.error.message : "An error occurred with the OpenRouter API." } });
        }

        res.json(data);

    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: "An internal server error occurred." } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
