require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: "Message is required" });
        }

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'qwen/qwen3.6-plus',
                messages: [
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000', // Optional, for OpenRouter rankings
                    'X-Title': 'AI Website' // Optional, for OpenRouter rankings
                }
            }
        );

        const aiMessage = response.data.choices[0].message.content;
        res.json({ message: aiMessage });

    } catch (error) {
        console.error('Error calling OpenRouter API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to fetch response from AI model" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
