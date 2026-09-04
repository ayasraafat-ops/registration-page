const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');
const errorMessageDiv = document.getElementById('error-message');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');

    if (role === 'user') {
        messageBubble.className = 'bg-blue-600 text-white rounded-lg rounded-tl-none p-3 max-w-[80%] shadow-sm';
    } else if (role === 'error') {
        messageBubble.className = 'bg-red-200 text-red-900 rounded-lg p-3 max-w-[80%] shadow-sm text-sm';
    } else {
        messageBubble.className = 'bg-blue-100 text-blue-900 rounded-lg rounded-tr-none p-3 max-w-[80%] shadow-sm';
    }

    messageBubble.style.whiteSpace = 'pre-wrap';
    messageBubble.textContent = content;

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageWrapper;
}

function showError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
    setTimeout(() => {
        errorMessageDiv.classList.add('hidden');
    }, 5000);
}

async function handleSendMessage(e) {
    if (e) e.preventDefault();

    const messageText = messageInput.value.trim();
    if (!messageText || sendButton.disabled) return;

    // Add user message to UI and history
    appendMessage('user', messageText);
    conversationHistory.push({ role: 'user', content: messageText });

    // Clear input and disable form
    messageInput.value = '';
    sendButton.disabled = true;
    sendButton.classList.add('opacity-50', 'cursor-not-allowed');
    errorMessageDiv.classList.add('hidden');

    // Add loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-start';
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'bg-gray-200 text-gray-600 rounded-lg rounded-tr-none p-3 shadow-sm';
    loadingBubble.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingBubble);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        chatContainer.removeChild(loadingWrapper);

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || `HTTP Error ${response.status}`;
            appendMessage('error', `حدث خطأ: ${errorMsg}`);
            // Remove the failed message from history so it can be retried if needed
            conversationHistory.pop();
            return;
        }

        const aiMessage = data.choices?.[0]?.message?.content;

        if (aiMessage) {
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            appendMessage('error', 'استجابة غير متوقعة من الخادم.');
            conversationHistory.pop();
        }

    } catch (error) {
        chatContainer.removeChild(loadingWrapper);
        appendMessage('error', `فشل الاتصال: ${error.message}`);
        conversationHistory.pop();
    } finally {
        // Re-enable form
        sendButton.disabled = false;
        sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
        messageInput.focus();
    }
}

chatForm.addEventListener('submit', handleSendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!sendButton.disabled) {
            handleSendMessage();
        }
    }
});

// Initial focus
messageInput.focus();
