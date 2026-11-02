const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let messagesHistory = [];

function appendMessage(role, content, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-tl-none'
            : (isError ? 'bg-red-100 text-red-800 rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tr-none')
    }`;
    bubble.textContent = content;

    messageDiv.appendChild(bubble);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'loading-indicator';
    messageDiv.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tr-none max-w-[80%]';
    bubble.textContent = 'يفكر...';

    messageDiv.appendChild(bubble);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Disable input while sending
    userInput.value = '';
    sendButton.disabled = true;
    userInput.disabled = true;

    appendMessage('user', message);
    messagesHistory.push({ role: 'user', content: message });

    appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messagesHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            const errorMessage = data.error && data.error.message ? data.error.message : 'حدث خطأ غير متوقع';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
            // Optionally remove the last user message from history if it failed
            messagesHistory.pop();
        } else if (data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            messagesHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            appendMessage('assistant', 'لم يتم استلام رد صالح.', true);
        }

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
        messagesHistory.pop();
    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
