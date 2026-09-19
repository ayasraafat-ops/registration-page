const messagesContainer = document.getElementById('messages');
const chatContainer = document.getElementById('chat-container');
const userInputElement = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let chatHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    const isUser = role === 'user';
    wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `p-3 max-w-[80%] shadow-sm rounded-lg ${isUser ? 'bg-blue-100 rounded-tl-none' : (isError ? 'bg-red-100 rounded-tr-none text-red-700' : 'bg-gray-200 rounded-tr-none')}`;

    const text = document.createElement('p');
    text.className = 'whitespace-pre-wrap';
    text.textContent = content; // Using textContent for XSS protection

    messageBox.appendChild(text);
    wrapper.appendChild(messageBox);
    messagesContainer.appendChild(wrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const messageBox = document.createElement('div');
    messageBox.className = 'bg-gray-200 rounded-lg rounded-tr-none p-3 max-w-[80%] shadow-sm text-gray-500 italic';
    messageBox.textContent = 'جاري الكتابة...';

    wrapper.appendChild(messageBox);
    messagesContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const content = userInputElement.value.trim();
    if (!content) return;

    userInputElement.value = '';
    sendButton.disabled = true;
    userInputElement.disabled = true;

    appendMessage('user', content);

    // Add user message to history
    chatHistory.push({ role: 'user', content: content });

    showLoading();

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
            const errorMsg = data.error?.message || 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            chatHistory.push({ role: 'assistant', content: aiMessage });
        }
    } catch (error) {
        removeLoading();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        sendButton.disabled = false;
        userInputElement.disabled = false;
        userInputElement.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInputElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
