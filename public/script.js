const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex', 'w-full');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('max-w-[80%]', 'p-3', 'rounded-lg', 'shadow-sm');
    messageDiv.style.whiteSpace = 'pre-wrap';

    if (role === 'user') {
        messageWrapper.classList.add('justify-start'); // User messages to the right in RTL
        messageDiv.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else if (role === 'assistant') {
        messageWrapper.classList.add('justify-end'); // Assistant messages to the left in RTL
        messageDiv.classList.add('bg-white', 'text-gray-800', 'border', 'border-gray-200', 'rounded-tr-none');
    } else if (role === 'error') {
        messageWrapper.classList.add('justify-end');
        messageDiv.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-300');
    }

    messageDiv.textContent = content;
    messageWrapper.appendChild(messageDiv);
    chatBox.appendChild(messageWrapper);

    // Scroll to bottom
    chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });
    userInput.value = '';

    // Disable input while waiting
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
            throw new Error(data.error || 'حدث خطأ أثناء الاتصال بالخادم.');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        appendMessage('error', error.message);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
