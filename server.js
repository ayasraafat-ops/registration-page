require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from 'public' with 1 day maxAge cache
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: "1d"
}));

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: "Invalid request: 'messages' array is required." } });
        }

        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                // ASCII characters only for custom headers
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat Application"
            },
            body: JSON.stringify({
                // Mapping user preferred qwen3.6-plus to a valid OpenRouter model
                model: "qwen/qwen-plus",
                messages: messages,
                max_tokens: 1000 // Restricted to avoid 402 errors
            })
        });

        const data = await openRouterResponse.json();

        // Pass any API-level errors directly to the client gracefully
        if (!openRouterResponse.ok) {
            console.error("OpenRouter API Error:", data.error ? data.error.message : "Unknown error");
            return res.status(openRouterResponse.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: { message: "Internal Server Error: " + error.message } });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
