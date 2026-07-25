const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const errorContainer = document.getElementById('error-container');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex');

    // User right (RTL context justify-start for User, justify-end for Assistant)
    // Actually, in RTL:
    // user (me) => right side => justify-start (start of RTL line is right)
    // assistant => left side => justify-end (end of RTL line is left)

    if (role === 'user') {
        wrapper.classList.add('justify-start');
    } else {
        wrapper.classList.add('justify-end');
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('p-3', 'rounded-lg', 'max-w-[75%]', 'whitespace-pre-wrap');

    if (role === 'user') {
        messageBubble.classList.add('bg-blue-600', 'text-white');
    } else {
        messageBubble.classList.add('bg-gray-200', 'text-gray-800');
    }

    messageBubble.textContent = content; // XSS protection
    wrapper.appendChild(messageBubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000);
}

async function sendMessage() {
    const userText = messageInput.value.trim();
    if (!userText) return;

    // UI Updates
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    errorContainer.classList.add('hidden');

    appendMessage('user', userText);

    const userMessage = { role: 'user', content: userText };
    conversationHistory.push(userMessage);

    // Show loading
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.classList.add('flex', 'justify-end');
    const loadingBubble = document.createElement('div');
    loadingBubble.classList.add('p-3', 'rounded-lg', 'bg-gray-200', 'text-gray-500', 'italic', 'text-sm');
    loadingBubble.textContent = 'جاري الكتابة...';
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

        const data = await response.json();

        // Remove loading
        document.getElementById('loading-indicator')?.remove();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم.');
        }

        const assistantMessageText = data.choices[0].message.content;
        appendMessage('assistant', assistantMessageText);
        conversationHistory.push({ role: 'assistant', content: assistantMessageText });

    } catch (error) {
        document.getElementById('loading-indicator')?.remove();
        showError(error.message);
        conversationHistory.pop(); // Remove the user message if it failed so they can try again
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
