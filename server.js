require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request: 'messages' array is required." } });
        }

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Chat App',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus',
                messages: messages,
                max_tokens: 1000
            })
        });

        // Some error responses might not be JSON, so we handle that safely.
        const contentType = openRouterResponse.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await openRouterResponse.json();
        } else {
            const textResponse = await openRouterResponse.text();
            console.error("OpenRouter API Error (Non-JSON):", textResponse);
            return res.status(openRouterResponse.status).json({ error: { message: `OpenRouter Error: ${openRouterResponse.statusText}` } });
        }

        if (!openRouterResponse.ok) {
             console.error("OpenRouter API Error:", data.error ? data.error.message : "Unknown Error");
             return res.status(openRouterResponse.status).json({ error: { message: data.error ? data.error.message : "Error from OpenRouter API" } });
        }

        res.json(data);

    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal server error." } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
