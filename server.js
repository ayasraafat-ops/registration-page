require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets with maxAge of 1 day
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1d" }));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Using ASCII string for HTTP headers to avoid node-fetch errors
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Chat Application"
      },
      body: JSON.stringify({
        model: "qwen/qwen-plus", // Qwen 3.6-plus mapped correctly
        messages: messages,
        max_tokens: 1000 // Limit to prevent 402 errors
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API Error:", data.error ? data.error.message : "Unknown error");
      return res.status(response.status).json({ error: data.error ? data.error.message : "Error connecting to AI service" });
    }

    res.json(data);
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
