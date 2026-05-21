const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Keep track of chat history for the API
let chatHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex', 'w-full');

    // In RTL: justify-end means left (for user), justify-start means right (for assistant)
    if (role === 'user') {
        wrapper.classList.add('justify-end');
    } else {
        wrapper.classList.add('justify-start');
    }

    const messageBox = document.createElement('div');
    messageBox.classList.add('max-w-xs', 'md:max-w-md', 'p-3', 'rounded-lg', 'shadow');

    if (role === 'user') {
        messageBox.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tl-none');
    } else if (role === 'assistant') {
        messageBox.classList.add('bg-green-100', 'text-green-900', 'rounded-tr-none');
    } else {
        messageBox.classList.add('bg-red-100', 'text-red-900'); // for errors
    }

    // Set textContent to prevent XSS. white-space: pre-wrap handles newlines.
    messageBox.style.whiteSpace = 'pre-wrap';
    messageBox.textContent = content;

    wrapper.appendChild(messageBox);
    messagesContainer.appendChild(wrapper);

    // Scroll to bottom
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    userInput.value = '';

    // Disable input while waiting
    userInput.disabled = true;
    sendButton.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ أثناء الاتصال بالخادم.');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        chatHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        appendMessage('error', `خطأ: ${error.message}`);
        console.error('Chat error:', error);
    } finally {
        // Re-enable input
        userInput.disabled = false;
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
