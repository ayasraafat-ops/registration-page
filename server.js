require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
    console.error('ERROR: OPENROUTER_API_KEY is not set in the environment variables.');
    process.exit(1);
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'qwen/qwen-plus'; // We use qwen/qwen-plus as qwen3.6-plus doesn't seem to be a valid model per the search results, it might just be the generic qwen-plus for the latest. Wait, user specified qwen3.6-plus in the prompt, let me use qwen/qwen-plus but let's check openrouter models again, ah the user asked for `qwen3.6-plus`. Let's use exactly `qwen/qwen3.6-plus` as the model string, or try to fallback. Let me write it.

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages) {
            return res.status(400).json({ error: 'Messages are required' });
        }

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
                'X-Title': 'AI Website Builder', // Optional but good practice
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen3.6-plus',
                messages: messages,
                max_tokens: 1000,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', response.status, errorText);
            return res.status(response.status).json({ error: `OpenRouter API error: ${response.status}` });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error proxying chat:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
