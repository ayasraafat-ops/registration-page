const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-lg shadow max-w-md ${role === 'user' ? 'bg-blue-600 text-white rounded-tl-none' : 'bg-white text-gray-800 rounded-tr-none'}`;
    if (role === 'error') {
        bubble.className = 'p-3 rounded-lg shadow max-w-md bg-red-100 text-red-700 rounded-tr-none';
    }

    // Prevent XSS using textContent
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.textContent = content;

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Disable input and button
    messageInput.value = '';
    messageInput.disabled = true;
    sendBtn.disabled = true;

    // Append user message
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start';
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none shadow max-w-md';
    loadingBubble.textContent = 'جاري الكتابة...';
    loadingWrapper.appendChild(loadingBubble);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير متوقع.';
            appendMessage('error', `خطأ: ${errorMsg}`);
        } else if (data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        appendMessage('error', `خطأ في الاتصال: ${error.message}`);
    } finally {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
});