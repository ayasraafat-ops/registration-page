const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

let messagesHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex';

    // In RTL:
    // User messages to the right (justify-start)
    // Assistant messages to the left (justify-end)
    if (role === 'user') {
        wrapper.classList.add('justify-start');
    } else {
        wrapper.classList.add('justify-end');
    }

    const messageBox = document.createElement('div');
    messageBox.className = 'p-3 rounded-lg max-w-[80%] whitespace-pre-wrap';

    if (role === 'user') {
        messageBox.classList.add('bg-blue-600', 'text-white');
    } else if (role === 'assistant') {
        messageBox.classList.add('bg-gray-200', 'text-gray-900');
    } else if (role === 'error') {
        messageBox.classList.add('bg-red-200', 'text-red-900');
    }

    messageBox.textContent = content; // XSS protection
    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    messagesHistory.push({ role: 'user', content: message });
    messageInput.value = '';

    const loadingId = 'loading-' + Date.now();

    // Add loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-end';
    const loadingBox = document.createElement('div');
    loadingBox.className = 'bg-gray-200 text-gray-900 p-3 rounded-lg max-w-[80%]';
    loadingBox.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingBox);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messagesHistory })
        });

        const data = await response.json();

        // Remove loading indicator
        document.getElementById(loadingId)?.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير معروف');
        }

        const assistantMessage = data.choices[0].message.content;
        appendMessage('assistant', assistantMessage);
        messagesHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        document.getElementById(loadingId)?.remove();
        appendMessage('error', 'خطأ: ' + error.message);
    }
});