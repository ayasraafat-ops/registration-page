const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
});

sendBtn.addEventListener('click', sendMessage);

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');

    if (role === 'user') {
        bubble.className = 'bg-blue-600 text-white p-3 rounded-lg rounded-tl-none max-w-3xl shadow-sm whitespace-pre-wrap';
    } else {
        if (isError) {
             bubble.className = 'bg-red-100 text-red-700 p-3 rounded-lg rounded-tr-none max-w-3xl shadow-sm whitespace-pre-wrap border border-red-300';
        } else {
             bubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tr-none max-w-3xl shadow-sm whitespace-pre-wrap';
        }
    }

    bubble.textContent = content; // Safely set text to prevent XSS
    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none shadow-sm flex space-x-1 space-x-reverse items-center';

    bubble.innerHTML = `
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
    `;

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Disable input while processing
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.disabled = true;
    sendBtn.disabled = true;

    // Display user message
    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            appendMessage('assistant', `خطأ: ${data.error || 'حدث خطأ غير معروف.'}`, true);
        } else {
            appendMessage('assistant', data.reply);
            conversationHistory.push({ role: 'assistant', content: data.reply });
        }
    } catch (error) {
        removeLoading();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}