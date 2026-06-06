const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `p-3 rounded-lg shadow-sm border max-w-[80%] ${
        role === 'user'
            ? 'bg-blue-600 text-white border-blue-600'
            : role === 'error'
                ? 'bg-red-100 text-red-800 border-red-200'
                : 'bg-white text-gray-800 border-gray-200'
    }`;

    const textElement = document.createElement('p');
    textElement.className = 'message-content';
    textElement.textContent = content; // XSS protection

    messageBox.appendChild(textElement);
    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'Unknown error occurred.';
            appendMessage('error', `عذراً، حدث خطأ: ${errorMsg}`);
            return;
        }

        const assistantMessage = data.choices[0].message.content;
        appendMessage('assistant', assistantMessage);
        conversationHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        appendMessage('error', `عذراً، حدث خطأ في الاتصال: ${error.message}`);
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}