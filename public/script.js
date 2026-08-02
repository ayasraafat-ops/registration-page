const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const messagesContainer = document.getElementById('messages');
const chatContainer = document.getElementById('chat-container');
const loadingIndicator = document.getElementById('loading');
const errorContainer = document.getElementById('error-container');
const errorMessageEl = document.getElementById('error-message');
const sendBtn = document.getElementById('send-btn');

// Keep track of the conversation history
let conversationHistory = [
    { role: "system", content: "You are a helpful, respectful, and honest AI assistant. Always answer in Arabic." }
];

function appendMessage(content, role) {
    const messageRow = document.createElement('div');
    messageRow.classList.add('flex');

    // In RTL, justify-start means left, justify-end means right.
    // However, usually in RTL chats, user is right (start), AI is left (end).
    // Let's standardise:
    // User -> right-aligned. In RTL layout, 'justify-start' aligns to the right.
    // Assistant -> left-aligned. In RTL layout, 'justify-end' aligns to the left.
    if (role === 'user') {
        messageRow.classList.add('justify-start');
    } else {
        messageRow.classList.add('justify-end');
    }

    const messageBox = document.createElement('div');
    messageBox.classList.add('p-3', 'rounded-lg', 'shadow', 'max-w-[80%]', 'message-content');

    if (role === 'user') {
        messageBox.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tr-none');
    } else {
        messageBox.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tl-none');
    }

    // Protect against XSS by setting textContent
    messageBox.textContent = content;

    messageRow.appendChild(messageBox);
    messagesContainer.appendChild(messageRow);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    errorMessageEl.textContent = message;
    errorContainer.classList.remove('hidden');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideError() {
    errorContainer.classList.add('hidden');
    errorMessageEl.textContent = '';
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text) return;

    // Reset UI state
    hideError();

    // Disable input while processing
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Append user message to UI
    appendMessage(text, 'user');

    // Add to history
    conversationHistory.push({ role: "user", content: text });

    // Clear input
    userInput.value = '';

    // Show loading
    loadingIndicator.classList.remove('hidden');
    chatContainer.scrollTop = chatContainer.scrollHeight;

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
            throw new Error(data.error?.message || 'حدث خطأ أثناء الاتصال بالخادم.');
        }

        const aiMessage = data.choices[0].message.content;

        // Append AI message to UI
        appendMessage(aiMessage, 'assistant');

        // Add to history
        conversationHistory.push({ role: "assistant", content: aiMessage });

    } catch (error) {
        showError(error.message);
        // Optionally pop the last user message from history if the request failed
        // conversationHistory.pop();
    } finally {
        // Hide loading
        loadingIndicator.classList.add('hidden');

        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
});
