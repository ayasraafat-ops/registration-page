const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const errorContainer = document.getElementById('error-container');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageText = messageInput.value.trim();
    if (!messageText) return;

    // Hide previous error
    errorContainer.classList.add('hidden');
    errorContainer.textContent = '';

    // Add user message to UI and history
    appendMessage('user', messageText);
    conversationHistory.push({ role: 'user', content: messageText });

    // Clear input and disable
    messageInput.value = '';
    messageInput.disabled = true;
    sendBtn.disabled = true;

    // Show loading
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

        // Remove loading
        removeLoading(loadingId);

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير معروف أثناء الاتصال بالخادم.');
        }

        const aiMessageText = data.choices[0].message.content;

        // Add AI message to UI and history
        appendMessage('assistant', aiMessageText);
        conversationHistory.push({ role: 'assistant', content: aiMessageText });

    } catch (error) {
        removeLoading(loadingId);
        showError(error.message);
        // Remove the user message from history if the request failed
        conversationHistory.pop();
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
});

function appendMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex ' + (role === 'user' ? 'justify-start' : 'justify-end'); // RTL layout: user left (start), assistant right (end) -- Wait, RTL means user right (start) and assistant left (end). Let's fix this.

    // In RTL, justify-start is the right side. User should be right.
    // Justify-end is the left side. Assistant should be left.
    wrapper.className = 'flex ' + (role === 'user' ? 'justify-start' : 'justify-end');

    const bubble = document.createElement('div');
    // Using Tailwind classes for styling
    if (role === 'user') {
        bubble.className = 'bg-blue-100 text-blue-900 p-3 rounded-lg shadow max-w-[75%]';
    } else {
        bubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg shadow max-w-[75%]';
    }

    // XSS Protection via textContent
    bubble.textContent = text;
    bubble.style.whiteSpace = 'pre-wrap';

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'flex justify-end'; // Assistant side

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg shadow max-w-[75%] flex space-x-2 space-x-reverse';

    // Add simple dots
    bubble.innerHTML = '<span>.</span><span>.</span><span>.</span>';

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
    }
}

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
}
