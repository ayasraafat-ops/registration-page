let messagesContext = [];

function appendMessage(role, content) {
    const chatBox = document.getElementById('chat-box');
    const messageContainer = document.createElement('div');

    // Memory instructions:
    // - User messages aligned right, assistant aligned left in RTL layout.
    // - Use textContent and 'white-space: pre-wrap' to prevent XSS.

    messageContainer.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = `max-w-[75%] p-3 rounded-lg ${role === 'user' ? 'bg-blue-100 text-blue-900 rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}`;
    messageBubble.style.whiteSpace = 'pre-wrap';
    messageBubble.textContent = content;

    messageContainer.appendChild(messageBubble);
    chatBox.appendChild(messageContainer);

    // Auto-scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const inputElement = document.getElementById('user-input');
    const text = inputElement.value.trim();
    const sendButton = document.getElementById('send-button');

    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);

    // Add user message to context
    messagesContext.push({ role: 'user', content: text });

    // Clear input
    inputElement.value = '';

    // Disable input/button while waiting
    inputElement.disabled = true;
    sendButton.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messagesContext })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ في الخادم');
        }

        const assistantMessage = data.choices[0].message.content;

        // Add assistant message to UI
        appendMessage('assistant', assistantMessage);

        // Add assistant message to context
        messagesContext.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        appendMessage('assistant', `خطأ: ${error.message}`);
    } finally {
        // Re-enable input/button
        inputElement.disabled = false;
        sendButton.disabled = false;
        inputElement.focus();
    }
}
