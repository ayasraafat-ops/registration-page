const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');

    // Style logic
    if (role === 'user') {
        messageBox.className = 'bg-blue-600 text-white rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-lg rounded-tl-none shadow';
    } else {
        if (isError) {
            messageBox.className = 'bg-red-200 text-red-900 rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-lg rounded-tr-none shadow';
        } else {
            messageBox.className = 'bg-gray-200 text-gray-900 rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-lg rounded-tr-none shadow';
        }
    }

    // XSS protection
    messageBox.style.whiteSpace = 'pre-wrap';
    messageBox.textContent = content;

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Auto-scroll
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable inputs
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Display user message
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-start mb-4';
    loadingWrapper.id = 'loading-indicator';
    const loadingBox = document.createElement('div');
    loadingBox.className = 'bg-gray-200 text-gray-500 rounded-lg p-3 max-w-xs rounded-tr-none shadow';
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

        // Remove loading
        const loadingElem = document.getElementById('loading-indicator');
        if (loadingElem) loadingElem.remove();

        if (!response.ok) {
            const errorMessage = data.error?.message || 'حدث خطأ غير معروف في الخادم.';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
        } else {
            const aiReply = data.choices[0]?.message?.content || '';
            appendMessage('assistant', aiReply);
            conversationHistory.push({ role: 'assistant', content: aiReply });
        }

    } catch (error) {
        // Remove loading
        const loadingElem = document.getElementById('loading-indicator');
        if (loadingElem) loadingElem.remove();

        appendMessage('assistant', `فشل الاتصال: ${error.message}`, true);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});