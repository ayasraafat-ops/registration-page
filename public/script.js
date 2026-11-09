const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`;

    const messageBubble = document.createElement('div');

    if (role === 'user') {
        messageBubble.className = 'bg-blue-600 text-white p-3 rounded-lg rounded-tl-none shadow max-w-[80%] whitespace-pre-wrap';
    } else {
        messageBubble.className = `${isError ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-200 text-gray-800'} p-3 rounded-lg rounded-tr-none shadow max-w-[80%] whitespace-pre-wrap`;
    }

    messageBubble.textContent = content;
    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (!isError && role !== 'loading') {
        conversationHistory.push({ role, content });
    }

    return messageWrapper;
}

async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    // Disable input while processing
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    appendMessage('user', content);

    // Add loading indicator
    const loadingMessageWrapper = appendMessage('loading', 'جاري التفكير...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });

        const data = await response.json();

        // Remove loading message
        loadingMessageWrapper.remove();

        if (!response.ok) {
            const errorMessage = data.error?.message || `خطأ ${response.status}: تعذر الحصول على رد.`;
            appendMessage('assistant', errorMessage, true);
        } else if (data.choices && data.choices.length > 0) {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
        } else {
             appendMessage('assistant', 'خطأ غير متوقع في استجابة الخادم.', true);
        }

    } catch (error) {
        loadingMessageWrapper.remove();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});