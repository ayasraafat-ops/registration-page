const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `max-w-[75%] p-3 rounded-lg shadow-sm whitespace-pre-wrap ${role === 'user' ? 'bg-blue-100 text-blue-900 rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}`;

    // Use textContent to prevent XSS
    messageBox.textContent = content;

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendError(message) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex justify-center my-2';

    const errorBox = document.createElement('div');
    errorBox.className = 'bg-red-200 text-red-800 text-sm p-2 rounded-lg text-center';
    errorBox.textContent = `خطأ: ${message}`;

    wrapper.appendChild(errorBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';

    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-end';
    loadingWrapper.id = 'loading-indicator';
    const loadingBox = document.createElement('div');
    loadingBox.className = 'bg-gray-200 text-gray-600 p-3 rounded-lg rounded-tl-none italic';
    loadingBox.textContent = 'جاري الكتابة...';
    loadingWrapper.appendChild(loadingBox);
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

        // Remove loading indicator
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) loadingEl.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ في الخادم');
        }

        const aiResponse = data.choices[0].message.content;
        appendMessage('assistant', aiResponse);
        conversationHistory.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        // Remove loading indicator on error as well
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) loadingEl.remove();

        appendError(error.message);
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
