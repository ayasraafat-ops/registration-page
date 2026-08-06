const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    // For RTL, justify-start is right (User), justify-end is left (Assistant)
    wrapper.className = `flex mb-4 ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap shadow-sm ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-tr-none'
            : role === 'error'
                ? 'bg-red-200 text-red-800 rounded-tl-none'
                : 'bg-gray-200 text-gray-800 rounded-tl-none'
    }`;

    // Prevent XSS
    messageBox.textContent = content;

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });
    messageInput.value = '';

    // Disable input while waiting
    messageInput.disabled = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير معروف');
        }

        const aiContent = data.choices[0].message.content;
        appendMessage('assistant', aiContent);
        conversationHistory.push({ role: 'assistant', content: aiContent });

    } catch (error) {
        console.error('Error:', error);
        appendMessage('error', `عذراً، حدث خطأ: ${error.message}`);
        // Remove the failed user message from history so it can be retried
        conversationHistory.pop();
    } finally {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});