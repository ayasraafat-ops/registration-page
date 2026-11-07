const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let messages = [];

function appendMessage(role, content, isError = false) {
    const messageDiv = document.createElement('div');
    const innerDiv = document.createElement('div');

    if (role === 'user') {
        // User message layout (RTL): aligned left visually
        messageDiv.className = 'flex justify-end';
        innerDiv.className = 'bg-blue-600 text-white p-4 rounded-xl rounded-tl-none shadow max-w-[80%] whitespace-pre-wrap';
    } else {
        // Assistant/Error message layout (RTL): aligned right visually
        messageDiv.className = 'flex justify-start';
        innerDiv.className = isError
            ? 'bg-red-100 text-red-800 p-4 rounded-xl rounded-tr-none shadow max-w-[80%] whitespace-pre-wrap border border-red-300'
            : 'bg-white text-gray-800 p-4 rounded-xl rounded-tr-none shadow max-w-[80%] whitespace-pre-wrap';
    }

    // Use textContent to prevent XSS
    innerDiv.textContent = content;
    messageDiv.appendChild(innerDiv);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function showLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'loading-indicator';
    messageDiv.className = 'flex justify-start';

    const innerDiv = document.createElement('div');
    innerDiv.className = 'bg-gray-200 text-gray-600 p-4 rounded-xl rounded-tr-none shadow flex gap-1 items-center';

    // Add dots animation
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
        dot.style.animationDelay = `${i * 0.15}s`;
        innerDiv.appendChild(dot);
    }

    messageDiv.appendChild(innerDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function removeLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendButton.disabled) return;

    // Add user message to UI and history
    appendMessage('user', text);
    messages.push({ role: 'user', content: text });

    userInput.value = '';
    sendButton.disabled = true;
    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `HTTP Error ${response.status}`);
        }

        const aiMessage = data.choices[0]?.message?.content;
        if (aiMessage) {
            appendMessage('assistant', aiMessage);
            messages.push({ role: 'assistant', content: aiMessage });
        } else {
            throw new Error("Invalid response format from server.");
        }

    } catch (error) {
        console.error("Error:", error);
        appendMessage('assistant', `حدث خطأ: ${error.message}`, true);
        // Do not add errors to conversation history to avoid polluting context
    } finally {
        removeLoading();
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
