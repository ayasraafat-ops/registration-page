const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, text, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');

    if (role === 'user') {
        messageBox.className = 'bg-blue-600 text-white p-4 rounded-lg rounded-tl-none max-w-[80%] whitespace-pre-wrap';
    } else {
        if (isError) {
            messageBox.className = 'bg-red-100 text-red-900 p-4 rounded-lg rounded-tr-none max-w-[80%] whitespace-pre-wrap';
        } else {
            messageBox.className = 'bg-gray-200 text-gray-900 p-4 rounded-lg rounded-tr-none max-w-[80%] whitespace-pre-wrap';
        }
    }

    messageBox.textContent = text;
    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start mb-4';

    const loadingBox = document.createElement('div');
    loadingBox.className = 'bg-gray-100 text-gray-500 p-3 rounded-lg rounded-tr-none max-w-[80%]';
    loadingBox.textContent = 'جاري التفكير...';

    wrapper.appendChild(loadingBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    if (sendButton.disabled) return; // Prevent double sending

    // Append user message
    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto'; // Reset height

    // Disable input
    sendButton.disabled = true;
    userInput.disabled = true;

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        hideLoading();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير معروف');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        hideLoading();
        appendMessage('assistant', `خطأ: ${error.message}`, true);
        // Remove the failed user message from history so they can try again
        conversationHistory.pop();
    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});