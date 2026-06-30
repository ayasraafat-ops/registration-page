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
const maxAge = 24 * 60 * 60 * 1000;
app.use(express.static(path.join(__dirname, 'public'), { maxAge }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid or missing 'messages' array in request body." } });
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                // Keep HTTP headers ASCII
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Arabic AI App'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            console.error("OpenRouter API Error:", data.error ? data.error.message : openRouterResponse.statusText);
            return res.status(openRouterResponse.status).json({ error: { message: data.error ? data.error.message : openRouterResponse.statusText } });
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
