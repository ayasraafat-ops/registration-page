const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with maxAge of 1 day
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid messages array." } });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Mapping qwen3.6-plus to a valid model
                "messages": messages,
                "max_tokens": 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter API Error:", data.error?.message || data);
            return res.status(response.status).json({ error: { message: data.error?.message || 'Error from OpenRouter API' } });
        }

        res.json(data);

    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: error.message } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
