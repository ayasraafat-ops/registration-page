# AI Chat Assistant (Arabic)

This project is a modern AI Chatbot web application designed specifically for Arabic speakers. It utilizes some of the latest web development technologies and integrates with OpenRouter to leverage the powerful **Qwen 3.6 Plus** model.

## Features

*   **Arabic First Design**: Fully built with Right-to-Left (RTL) language support and tailored for an optimal Arabic language user experience.
*   **Modern AI Integration**: Connects seamlessly with OpenRouter to use the advanced `qwen/qwen3.6-plus` language model for intelligent, context-aware responses.
*   **Responsive UI**: A clean, modern interface built using Tailwind CSS that works beautifully on both desktop and mobile devices.
*   **Real-time Chat**: Interactive chat interface with loading indicators and separated message bubbles for the user and the AI assistant.
*   **Secure Backend**: An Express.js backend acts as a secure proxy to communicate with OpenRouter, ensuring that API keys are never exposed on the frontend.

## Technologies Used

*   **Frontend**: HTML5, CSS3, JavaScript, Tailwind CSS (via CDN for rapid prototyping and styling)
*   **Backend**: Node.js, Express.js
*   **API Integration**: `node-fetch` for communicating with OpenRouter API
*   **Environment Variables**: `dotenv` for managing sensitive API keys securely

## Prerequisites

*   Node.js (v14 or higher recommended)
*   npm (Node Package Manager)
*   An OpenRouter API key

## Setup and Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/ayasraafat-ops/registration-page.git
    cd registration-page
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    *   Create a `.env` file in the root directory.
    *   Add your OpenRouter API key to the `.env` file:
        ```
        OPENROUTER_API_KEY=your_openrouter_api_key_here
        ```
        *(Note: The `.env` file is included in `.gitignore` to prevent accidental commits of your API key).*

4.  **Start the server**:
    ```bash
    npm start
    ```

5.  **Access the application**:
    Open your web browser and navigate to `http://localhost:3000`.
