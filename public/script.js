const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex');

    // RTL layout alignments
    if (role === 'user') {
        messageWrapper.classList.add('justify-end');
    } else {
        messageWrapper.classList.add('justify-start');
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('p-3', 'rounded-xl', 'max-w-[80%]', 'whitespace-pre-wrap');

    if (isError) {
        messageBubble.classList.add('bg-red-100', 'text-red-800');
    } else if (role === 'user') {
        messageBubble.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else {
        messageBubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    }

    // XSS Protection: use textContent
    messageBubble.textContent = content;

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const loadingId = 'loading-indicator';
    const wrapper = document.createElement('div');
    wrapper.id = loadingId;
    wrapper.classList.add('flex', 'justify-start');

    const bubble = document.createElement('div');
    bubble.classList.add('p-3', 'rounded-xl', 'rounded-tr-none', 'bg-gray-200', 'text-gray-600', 'italic', 'text-sm');
    bubble.textContent = 'جاري الكتابة...';

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return loadingId;
}

function removeLoading(loadingId) {
    const element = document.getElementById(loadingId);
    if (element) {
        element.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    sendButton.disabled = true;
    userInput.disabled = true;
    userInput.value = '';

    // Append user message
    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    const loadingId = showLoading();

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
            // Extract error message as specifically required
            const errorMessage = data.error?.message || 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }
    } catch (error) {
        removeLoading(loadingId);
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
