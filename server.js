require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with maxAge
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request format. 'messages' array is required." } });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
             return res.status(500).json({ error: { message: "Server misconfiguration. Missing API Key." } });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Arabic AI Chat',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-plus', // Map to valid OpenRouter model for qwen3.6-plus preference
                messages: messages,
                max_tokens: 1000 // Prevent 402 errors
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Check for specific OpenRouter error
            let errorMessage = "An error occurred while calling the AI model.";
            if (data.error && data.error.message) {
                 errorMessage = data.error.message;
            } else if (response.status === 401) {
                 errorMessage = "User not found or invalid API key.";
            } else if (response.status === 402) {
                 errorMessage = "Insufficient credits.";
            }

            // Log only safe info to avoid information exposure
            console.error(`OpenRouter API Error: Status ${response.status} - ${errorMessage}`);
            return res.status(response.status).json({ error: { message: errorMessage } });
        }

        res.json(data);
    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal Server Error" } });
    }
});

app.listen(PORT, () => {
    console.lang="ar"
    console.log(`Server is running on port ${PORT}`);
});
