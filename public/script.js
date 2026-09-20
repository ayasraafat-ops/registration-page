const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history for the API payload
let messagesContext = [];

function appendMessage(role, text, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const messageBubble = document.createElement('div');

    if (role === 'user') {
        messageBubble.className = 'bg-blue-600 text-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]';
    } else {
        if (isError) {
             messageBubble.className = 'bg-red-100 text-red-800 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] border border-red-200';
        } else {
             messageBubble.className = 'bg-gray-200 text-gray-800 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]';
        }
    }

    const messageText = document.createElement('p');
    messageText.style.whiteSpace = 'pre-wrap';
    messageText.textContent = text; // XSS Protection

    messageBubble.appendChild(messageText);
    messageWrapper.appendChild(messageBubble);
    chatHistory.appendChild(messageWrapper);

    // Auto-scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-100 text-gray-500 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] flex items-center gap-2';

    const text = document.createElement('span');
    text.textContent = 'جاري التفكير...';
    bubble.appendChild(text);

    wrapper.appendChild(bubble);
    chatHistory.appendChild(wrapper);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function hideLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    if (sendButton.disabled) return; // Prevent duplicate requests

    // 1. Display user message
    appendMessage('user', text);

    // Add to context
    messagesContext.push({ role: 'user', content: text });

    // 2. Clear input and disable button
    userInput.value = '';
    userInput.style.height = 'auto'; // reset height
    sendButton.disabled = true;
    userInput.disabled = true;

    // 3. Show loading indicator
    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messagesContext })
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
             const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف.';
             appendMessage('assistant', `خطأ: ${errorMsg}`, true);
             // We might want to remove the last user message from context if it failed, but let's keep it simple for now.
             return;
        }

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const assistantContent = data.choices[0].message.content;
            appendMessage('assistant', assistantContent);
            messagesContext.push({ role: 'assistant', content: assistantContent });
        } else {
             appendMessage('assistant', 'لم يتم استلام رد صحيح من الخادم.', true);
        }

    } catch (error) {
        hideLoading();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
