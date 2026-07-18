const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory with 1 day maxAge
app.use(express.static('public', { maxAge: '1d' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
                // ASCII-only headers if adding HTTP Referer or X-Title
            },
            body: JSON.stringify({
                "model": "qwen/qwen-plus", // Mapping qwen3.6-plus to available qwen-plus model
                "messages": messages,
                "max_tokens": 1000 // Limiting max tokens to prevent insufficient credit errors
            })
        });

        if (!openRouterResponse.ok) {
             const errorData = await openRouterResponse.text();
             let safeError = "An error occurred with the OpenRouter API.";
             try {
                const parsedError = JSON.parse(errorData);
                safeError = parsedError.error?.message || safeError;
             } catch (e) {
                // If not JSON, use the raw text but log it carefully (or don't send raw text to frontend if it could be sensitive)
                console.error("OpenRouter non-JSON error:", errorData);
             }
             return res.status(openRouterResponse.status).json({ error: { message: safeError } });
        }

        const data = await openRouterResponse.json();
        res.json(data);

    } catch (error) {
        console.error("Internal server error:", error);
        res.status(500).json({ error: { message: error.message || "Internal server error" } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
