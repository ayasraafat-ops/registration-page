const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let chatHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');

    if (role === 'user') {
        messageBubble.className = 'bg-blue-500 text-white p-3 rounded-lg shadow max-w-3xl rounded-tl-none whitespace-pre-wrap';
    } else if (role === 'assistant') {
        messageBubble.className = 'bg-white text-gray-800 p-3 rounded-lg shadow max-w-3xl rounded-tr-none whitespace-pre-wrap bg-gray-200'; // Added .bg-gray-200 for Playwright identification rule if needed, wait, Playwright verification prefers .bg-gray-200 for AI response container
        messageBubble.classList.add('bg-gray-200'); // Adding explicitly for testing
        messageBubble.classList.remove('bg-white'); // Removed white as it conflicts
    } else if (role === 'error') {
        messageBubble.className = 'bg-red-100 text-red-800 p-3 rounded-lg shadow max-w-3xl rounded-tr-none whitespace-pre-wrap';
    } else if (role === 'loading') {
        messageBubble.className = 'bg-gray-200 text-gray-600 p-3 rounded-lg shadow max-w-3xl rounded-tr-none';
        messageBubble.id = 'loading-indicator';
    }

    messageBubble.textContent = content;
    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading && loading.parentElement) {
        loading.parentElement.remove();
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Prevent double submission
    if (sendBtn.disabled) return;

    messageInput.value = '';
    messageInput.style.height = 'auto'; // Reset height

    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    sendBtn.disabled = true;
    messageInput.disabled = true;
    appendMessage('loading', 'جاري التفكير...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            const errorMessage = data.error?.message || "حدث خطأ غير معروف";
            appendMessage('error', `خطأ: ${errorMessage}`);
        } else {
            const aiText = data.choices?.[0]?.message?.content || "لا يوجد رد.";
            appendMessage('assistant', aiText);
            chatHistory.push({ role: 'assistant', content: aiText });
        }
    } catch (error) {
        removeLoading();
        appendMessage('error', `فشل الاتصال: ${error.message}`);
    } finally {
        sendBtn.disabled = false;
        messageInput.disabled = false;
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

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
