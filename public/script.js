const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, text, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex', 'w-full');

    // In RTL: justify-start is right (user), justify-end is left (assistant)
    if (role === 'user') {
        messageWrapper.classList.add('justify-start');
    } else {
        messageWrapper.classList.add('justify-end');
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('max-w-[75%]', 'p-3', 'rounded-lg', 'shadow-sm');
    messageBubble.style.whiteSpace = 'pre-wrap';

    if (role === 'user') {
        messageBubble.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tr-none');
    } else {
        if (isError) {
            messageBubble.classList.add('bg-red-200', 'text-red-900', 'rounded-tl-none');
        } else {
            messageBubble.classList.add('bg-gray-200', 'text-gray-900', 'rounded-tl-none');
        }
    }

    // Use textContent for XSS protection
    messageBubble.textContent = text;

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageWrapper; // Return wrapper for possible removal (like loading indicators)
}

function appendLoading() {
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.classList.add('flex', 'w-full', 'justify-end');

    const loadingBubble = document.createElement('div');
    loadingBubble.classList.add('bg-gray-200', 'text-gray-500', 'p-3', 'rounded-lg', 'rounded-tl-none', 'shadow-sm');
    loadingBubble.textContent = 'جاري التفكير...';

    loadingWrapper.appendChild(loadingBubble);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loadingWrapper = document.getElementById('loading-indicator');
    if (loadingWrapper) {
        loadingWrapper.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = messageInput.value.trim();
    if (!userText) return;

    // Add user message to UI
    appendMessage('user', userText);
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Add to history
    conversationHistory.push({ role: 'user', content: userText });

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
            throw new Error(data.error || 'حدث خطأ أثناء الاتصال بالخادم');
        }

        const aiText = data.choices[0].message.content;

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiText });

        // Add AI message to UI
        appendMessage('assistant', aiText);

    } catch (error) {
        removeLoading();
        console.error('Error:', error);
        appendMessage('assistant', `خطأ: ${error.message}`, true);
        // Remove the failed user message from history so they can retry
        conversationHistory.pop();
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
});

// Initial welcome message
window.addEventListener('DOMContentLoaded', () => {
    appendMessage('assistant', 'مرحباً! كيف يمكنني مساعدتك اليوم؟');
});
