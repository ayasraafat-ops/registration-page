let conversationHistory = [];

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex', 'w-full');

    // In RTL:
    // User messages left -> justify-end
    // Assistant messages right -> justify-start
    if (role === 'user') {
        messageWrapper.classList.add('justify-end');
    } else {
        messageWrapper.classList.add('justify-start');
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('rounded-lg', 'py-2', 'px-4', 'max-w-[80%]', 'shadow-sm', 'whitespace-pre-wrap');

    if (role === 'user') {
        messageBubble.classList.add('bg-blue-500', 'text-white');
    } else if (role === 'error') {
        messageBubble.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-400');
    } else {
        messageBubble.classList.add('bg-gray-200', 'text-gray-800');
    }

    // XSS Protection
    messageBubble.textContent = content;

    messageWrapper.appendChild(messageBubble);
    chatBox.appendChild(messageWrapper);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    // Disable input while processing
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Display user message
    appendMessage('user', content);

    // Add to history
    conversationHistory.push({ role: 'user', content: content });

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
            throw new Error(data.error?.message || 'Failed to fetch response from server.');
        }

        const aiMessageContent = data.choices?.[0]?.message?.content;

        if (aiMessageContent) {
            appendMessage('assistant', aiMessageContent);
            conversationHistory.push({ role: 'assistant', content: aiMessageContent });
        } else {
            throw new Error('Invalid response format received from server.');
        }

    } catch (error) {
        console.error("Chat Error:", error);
        appendMessage('error', 'عذراً، حدث خطأ: ' + error.message);
        // Optionally remove the last user message from history if the request failed
        // conversationHistory.pop();
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}
