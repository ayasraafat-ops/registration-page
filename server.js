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
    maxAge: '1d' // 1 day
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid or missing 'messages' array in request body." } });
        }

        const openrouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openrouterApiKey) {
            return res.status(500).json({ error: { message: "OpenRouter API Key not configured." } });
        }

        // Qwen3.6-plus model as requested
        const model = 'qwen/qwen-plus';

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openrouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Website'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter Error:', data.error ? data.error.message : response.statusText);
            return res.status(response.status).json({ error: { message: data.error ? data.error.message : response.statusText } });
        }

        res.json(data);
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: { message: 'Internal Server Error' } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
