const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let messages = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `p-3 rounded-lg max-w-[75%] ${role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'}`;
    messageBox.style.whiteSpace = 'pre-wrap';
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.className = 'flex justify-end';

    const loadingBox = document.createElement('div');
    loadingBox.className = 'p-3 rounded-lg max-w-[75%] bg-gray-200 text-gray-700 italic';
    loadingBox.textContent = 'جاري الكتابة...';

    loadingWrapper.appendChild(loadingBox);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loadingWrapper = document.getElementById('loading-indicator');
    if (loadingWrapper) {
        loadingWrapper.remove();
    }
}

async function sendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Clear input
    messageInput.value = '';

    // Append user message to UI
    appendMessage('user', userMessage);

    // Add to message history
    messages.push({ role: 'user', content: userMessage });

    // Show loading
    appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            const errorMessage = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMessage}`);
            return;
        }

        const aiResponse = data.choices[0].message.content;
        appendMessage('assistant', aiResponse);

        // Add AI response to history
        messages.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `حدث خطأ في الاتصال: ${error.message}`);
    }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
