const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'mb-4');

    if (role === 'user') {
        messageDiv.classList.add('justify-end');
    } else {
        messageDiv.classList.add('justify-start');
    }

    const bubble = document.createElement('div');
    bubble.classList.add('p-3', 'rounded-lg', 'max-w-3xl', 'whitespace-pre-wrap');

    if (role === 'user') {
        bubble.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else {
        bubble.classList.add('text-gray-800', 'rounded-tr-none');
        if (isError) {
            bubble.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-400');
        } else {
            bubble.classList.add('bg-gray-200');
        }
    }

    // Set textContent to prevent XSS
    bubble.textContent = content;

    messageDiv.appendChild(bubble);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageDiv;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Disable input while processing
    messageInput.disabled = true;
    sendBtn.disabled = true;
    messageInput.value = '';

    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('flex', 'justify-start', 'mb-4');
    loadingDiv.id = 'loading-indicator';
    const loadingBubble = document.createElement('div');
    loadingBubble.classList.add('p-3', 'rounded-lg', 'rounded-tr-none', 'bg-gray-200', 'text-gray-500', 'max-w-3xl', 'italic');
    loadingBubble.textContent = 'جاري التفكير...';
    loadingDiv.appendChild(loadingBubble);
    chatContainer.appendChild(loadingDiv);
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
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            let errorMsg = 'حدث خطأ في الاتصال بالخادم.';
            if (data.error && data.error.message) {
                errorMsg += '\nالتفاصيل: ' + data.error.message;
            }
            appendMessage('assistant', errorMsg, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        // Remove loading
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', 'حدث خطأ غير متوقع: ' + error.message, true);
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled) {
        sendMessage();
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        sendMessage();
    }
});
