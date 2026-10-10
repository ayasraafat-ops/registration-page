const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Store conversation history for API
let conversationHistory = [];

function appendMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-lg max-w-[80%] ${
        role === 'user'
            ? 'bg-blue-100 text-blue-900 rounded-tl-none'
            : role === 'error'
                ? 'bg-red-100 text-red-900 rounded-tr-none'
                : 'bg-gray-200 text-gray-800 rounded-tr-none'
    }`;

    const content = document.createElement('p');
    content.className = 'message-content';
    content.textContent = text; // XSS protection

    bubble.appendChild(content);
    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tr-none max-w-[80%]';
    bubble.innerHTML = '<span class="animate-pulse">...</span>';

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Disable input and button
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Display user message
    appendMessage('user', text);

    // Update history
    conversationHistory.push({ role: "user", content: text });

    // Show loading
    appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير متوقع');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);

        // Update history
        conversationHistory.push({ role: "assistant", content: aiMessage });

    } catch (error) {
        removeLoading();
        console.error('Error:', error);
        appendMessage('error', `عذراً، حدث خطأ: ${error.message}`);
        // Remove the user message from history if it failed
        conversationHistory.pop();
    } finally {
        // Re-enable input and button
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
