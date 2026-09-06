const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = `p-3 rounded-lg max-w-[80%] shadow-sm ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-tl-none'
            : 'bg-white text-gray-800 rounded-tr-none'
    }`;

    // XSS Protection
    messageBubble.textContent = content;
    messageBubble.style.whiteSpace = 'pre-wrap';

    wrapper.appendChild(messageBubble);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendButton.disabled) return;

    userInput.value = '';
    sendButton.disabled = true;

    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

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
            throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        console.error("Chat Error:", error);
        appendMessage('assistant', `حدث خطأ: ${error.message}`);
    } finally {
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
