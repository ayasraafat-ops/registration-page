const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `max-w-[70%] p-3 rounded-lg ${
        role === 'user'
        ? 'bg-blue-600 text-white rounded-tr-none'
        : role === 'error'
        ? 'bg-red-100 text-red-700 rounded-tl-none border border-red-300'
        : 'bg-gray-200 text-gray-800 rounded-tl-none'
    }`;

    // Use textContent to prevent XSS
    bubble.textContent = content;
    bubble.style.whiteSpace = 'pre-wrap';

    messageDiv.appendChild(bubble);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Disable input while loading
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
            throw new Error(data.error?.message || "فشل في الاتصال بالخادم.");
        }

        const assistantMessage = data.choices[0].message.content;
        appendMessage('assistant', assistantMessage);

        // Add assistant response to history
        conversationHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        console.error('Error:', error);
        appendMessage('error', `حدث خطأ: ${error.message}`);
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
