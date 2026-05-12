const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const errorContainer = document.getElementById("error-container");

// Store message history for context
let messageHistory = [];

// Function to safely append a message to the UI
function appendMessage(role, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const innerDiv = document.createElement("div");
    innerDiv.className = `p-4 rounded-lg shadow-sm max-w-3xl border ${
        role === 'user'
        ? 'bg-blue-100 text-blue-900 border-blue-200 rounded-tr-none'
        : 'bg-white text-gray-800 border-gray-200 rounded-tl-none'
    }`;

    const textP = document.createElement("p");
    textP.className = "message-content"; // Ensures white-space: pre-wrap from CSS
    textP.textContent = content; // XSS protection: strictly use textContent

    innerDiv.appendChild(textP);
    messageDiv.appendChild(innerDiv);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to handle showing errors
function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove("hidden");
    setTimeout(() => {
        errorContainer.classList.add("hidden");
        errorContainer.textContent = "";
    }, 5000);
}

// Function to send message to backend
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    userInput.value = "";
    userInput.disabled = true;
    sendButton.disabled = true;

    // Add user message to UI and history
    appendMessage("user", text);
    messageHistory.push({ role: "user", content: text });

    // Show loading state (optional)
    const loadingId = "loading-message";
    const loadingDiv = document.createElement("div");
    loadingDiv.id = loadingId;
    loadingDiv.className = "flex justify-start mb-4";
    loadingDiv.innerHTML = `
        <div class="bg-gray-100 text-gray-500 p-4 rounded-lg shadow-sm border border-gray-200">
            <p>جاري التفكير...</p>
        </div>
    `;
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages: messageHistory })
        });

        const data = await response.json();

        // Remove loading state
        document.getElementById(loadingId)?.remove();

        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch response");
        }

        const aiMessage = data.choices[0].message.content;

        // Add AI message to UI and history
        appendMessage("assistant", aiMessage);
        messageHistory.push({ role: "assistant", content: aiMessage });

    } catch (error) {
        // Remove loading state
        document.getElementById(loadingId)?.remove();
        console.error("Error:", error);
        showError(`حدث خطأ: ${error.message}`);
        // Optionally remove the last user message from history if it failed
        messageHistory.pop();
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
userInput.addEventListener("input", function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
