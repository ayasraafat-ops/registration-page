const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex');

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('rounded-lg', 'py-2', 'px-4', 'max-w-[70%]');

    const textElement = document.createElement('p');
    textElement.style.whiteSpace = 'pre-wrap';
    textElement.textContent = content; // Prevent XSS

    if (role === 'user') {
        messageWrapper.classList.add('justify-end'); // Left aligned in RTL
        messageBubble.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else if (role === 'assistant') {
        messageWrapper.classList.add('justify-start'); // Right aligned in RTL
        messageBubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    } else if (role === 'error') {
        messageWrapper.classList.add('justify-start');
        messageBubble.classList.add('bg-red-100', 'text-red-800', 'rounded-tr-none');
    }

    messageBubble.appendChild(textElement);
    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const loadingId = 'loading-' + Date.now();
    const messageWrapper = document.createElement('div');
    messageWrapper.id = loadingId;
    messageWrapper.classList.add('flex', 'justify-start');

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('bg-gray-200', 'text-gray-500', 'rounded-lg', 'rounded-tr-none', 'py-2', 'px-4', 'max-w-[70%]');
    messageBubble.textContent = 'جاري التفكير...';

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return loadingId;
}

function removeLoading(loadingId) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
        loadingElement.remove();
    }
}

async function sendMessage() {
    const messageText = userInput.value.trim();
    if (!messageText) return;

    appendMessage('user', messageText);
    conversationHistory.push({ role: 'user', content: messageText });
    userInput.value = '';

    sendButton.disabled = true;
    const loadingId = appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading(loadingId);

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('error', `عذراً، حدث خطأ: ${errorMsg}`);
            return;
        }

        const assistantMessage = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        if (assistantMessage) {
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            appendMessage('error', 'استجابة غير صالحة من الخادم.');
        }

    } catch (error) {
        removeLoading(loadingId);
        appendMessage('error', `عذراً، حدث خطأ في الاتصال: ${error.message}`);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
