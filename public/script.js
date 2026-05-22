const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const errorContainer = document.getElementById('error-container');
const errorMessageEl = document.getElementById('error-message');

let conversationHistory = [];

function showError(message) {
    errorMessageEl.textContent = message;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000); // Hide error after 5 seconds
}

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = `p-3 rounded-lg shadow max-w-[80%] whitespace-pre-wrap ${role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-white text-gray-800'}`;

    // Using textContent to prevent XSS
    messageBubble.textContent = content;

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add to UI
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading state
    sendButton.disabled = true;
    sendButton.textContent = 'جاري الإرسال...';
    sendButton.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'Unknown server error';
            throw new Error(`Server returned ${response.status}: ${errorMsg}`);
        }

        if (data.choices && data.choices.length > 0) {
            const assistantMessage = data.choices[0].message;
            conversationHistory.push(assistantMessage);
            appendMessage('assistant', assistantMessage.content);
        } else {
            throw new Error('Invalid response format from server');
        }

    } catch (error) {
        console.error('Chat error:', error);
        showError(error.message);
    } finally {
        // Reset button state
        sendButton.disabled = false;
        sendButton.textContent = 'إرسال';
        sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});