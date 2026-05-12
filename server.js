require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with a maxAge of 1 day (86400000 ms)
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: '1d'
}));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid payload. 'messages' array is required." });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Arabic AI Chat",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen-plus",
        messages: messages,
        max_tokens: 1000,
      })
    });

    const data = await response.json();

    if (!response.ok) {
        // Sanitize error response to prevent Information Exposure
        console.error("OpenRouter API Error:", data.error?.message || "Unknown error from API");
        return res.status(response.status).json({ error: data.error?.message || "Failed to communicate with the AI model." });
    }

    res.json(data);

  } catch (error) {
    console.error("Internal Server Error:", error.message);
    res.status(500).json({ error: "Internal server error occurred." });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
