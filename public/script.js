const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');

    // Style based on role and direction RTL
    if (role === 'user') {
        messageDiv.className = 'bg-blue-600 text-white rounded-lg p-3 max-w-[80%] rounded-tl-none';
    } else {
        messageDiv.className = 'bg-gray-200 text-gray-800 rounded-lg p-3 max-w-[80%] rounded-tr-none';
    }

    // Use textContent to prevent XSS
    messageDiv.textContent = content;
    messageDiv.style.whiteSpace = 'pre-wrap';

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000);
}

function showLoading() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = 'loading-indicator';
    wrapperDiv.className = 'flex justify-start';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-200 text-gray-500 rounded-lg p-3 rounded-tr-none animate-pulse';
    loadingDiv.textContent = 'جاري التفكير...';

    wrapperDiv.appendChild(loadingDiv);
    chatContainer.appendChild(wrapperDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function handleSubmit(e) {
    if (e) e.preventDefault();

    const userMessage = messageInput.value.trim();
    if (!userMessage || sendButton.disabled) return;

    messageInput.value = '';
    sendButton.disabled = true;
    errorContainer.classList.add('hidden');

    appendMessage('user', userMessage);
    conversationHistory.push({ role: 'user', content: userMessage });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        hideLoading();

        if (!response.ok) {
            console.error("Error from server:", data);
            throw new Error(data.error?.message || 'حدث خطأ في الاتصال بالخادم');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        hideLoading();
        showError(error.message);
        // Remove the failed user message from history so they can try again
        conversationHistory.pop();
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
}

chatForm.addEventListener('submit', handleSubmit);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            handleSubmit();
        }
    }
});
