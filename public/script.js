// Store the conversation history
let conversationHistory = [];

function appendMessage(role, content) {
    const chatWindow = document.getElementById('chat-window');

    const messageContainer = document.createElement('div');
    messageContainer.className = 'flex';

    // In RTL: User aligns left (justify-end in flex row-reverse context, or justify-end natively if dir=rtl flex handles it)
    // Actually, in standard RTL with flexbox, 'justify-start' starts from the right, 'justify-end' is left.
    // User -> left (justify-end), Assistant -> right (justify-start)
    if (role === 'user') {
        messageContainer.classList.add('justify-end');
    } else {
        messageContainer.classList.add('justify-start');
    }

    const messageBox = document.createElement('div');
    messageBox.className = 'p-3 rounded-lg max-w-[80%] whitespace-pre-wrap';

    if (role === 'user') {
        messageBox.classList.add('bg-blue-600', 'text-white');
    } else {
        messageBox.classList.add('bg-gray-200', 'text-gray-800');
    }

    if (role === 'error') {
        messageBox.classList.remove('bg-gray-200', 'text-gray-800');
        messageBox.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-400');
        messageContainer.classList.add('justify-center');
    }

    // Set textContent to prevent XSS
    messageBox.textContent = content;

    messageContainer.appendChild(messageBox);
    chatWindow.appendChild(messageContainer);

    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const inputElement = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const message = inputElement.value.trim();

    if (!message) return;

    // Clear input and disable
    inputElement.value = '';
    inputElement.disabled = true;
    sendButton.disabled = true;

    // Append user message to UI
    appendMessage('user', message);

    // Add to history
    conversationHistory.push({ role: 'user', content: message });

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
            throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
        }

        const assistantMessage = data.choices[0].message.content;

        // Append assistant message to UI
        appendMessage('assistant', assistantMessage);

        // Add to history
        conversationHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        console.error('Error:', error);
        appendMessage('error', 'عذراً، حدث خطأ: ' + error.message);
        // Remove the failed user message from history so they can try again
        conversationHistory.pop();
    } finally {
        // Re-enable input
        inputElement.disabled = false;
        sendButton.disabled = false;
        inputElement.focus();
    }
}
