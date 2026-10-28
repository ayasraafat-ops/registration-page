const chatContainer = document.getElementById('chat-container');
const messagesList = document.getElementById('messages-list');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let chatHistory = [];

function appendMessage(role, text) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = `p-4 rounded-lg shadow max-w-[80%] whitespace-pre-wrap ${
        role === 'user'
        ? 'bg-blue-600 text-white rounded-tl-none'
        : role === 'error'
        ? 'bg-red-100 text-red-800 rounded-tr-none'
        : 'bg-white text-gray-800 rounded-tr-none'
    }`;

    // Prevent XSS by using textContent
    messageBubble.textContent = text;

    messageWrapper.appendChild(messageBubble);
    messagesList.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    userInput.value = '';
    sendBtn.disabled = true;
    userInput.disabled = true;

    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.innerHTML = `<div class="bg-gray-200 text-gray-500 p-4 rounded-lg rounded-tr-none shadow max-w-[80%]">جاري التفكير...</div>`;
    messagesList.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });

        const data = await response.json();

        // Remove loading
        document.getElementById(loadingId).remove();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage('error', `خطأ: ${errorMsg}`);
            return;
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        chatHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        document.getElementById(loadingId).remove();
        appendMessage('error', `حدث خطأ في الاتصال بالخادم: ${error.message}`);
    } finally {
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // verify send button is not disabled before submitting
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
});
