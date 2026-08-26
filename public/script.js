const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${role === 'user' ? 'bg-blue-600 text-white' : role === 'error' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`;
    messageBox.textContent = content; // Prevents XSS

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function showLoading() {
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.className = 'flex justify-end';

    const loadingBox = document.createElement('div');
    loadingBox.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg max-w-[80%]';
    loadingBox.textContent = 'جاري التفكير...';

    loadingWrapper.appendChild(loadingBox);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function removeLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to UI and history
    appendMessage('user', message);
    conversationHistory.push({ role: 'user', content: message });
    userInput.value = '';

    showLoading();
    sendButton.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            const errorMessage = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('error', `خطأ: ${errorMessage}`);
        } else {
            const aiResponse = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : 'لا يوجد رد.';
            appendMessage('assistant', aiResponse);
            conversationHistory.push({ role: 'assistant', content: aiResponse });
        }
    } catch (error) {
        removeLoading();
        appendMessage('error', `خطأ في الاتصال: ${error.message}`);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});
