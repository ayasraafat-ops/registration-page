const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageRow = document.createElement('div');
    messageRow.className = 'flex w-full ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const messageBubble = document.createElement('div');
    messageBubble.className = 'p-3 rounded-lg max-w-[80%] shadow message-content ';

    if (role === 'user') {
        messageBubble.className += 'bg-blue-600 text-white rounded-tl-none';
    } else if (role === 'assistant') {
        messageBubble.className += 'bg-gray-200 text-gray-800 rounded-tr-none';
    } else {
        messageBubble.className += 'bg-red-100 text-red-800 rounded-tr-none border border-red-300';
    }

    messageBubble.textContent = content; // XSS protection

    messageRow.appendChild(messageBubble);
    chatContainer.appendChild(messageRow);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    if (sendButton.disabled) return;

    // UI Updates before sending
    messageInput.value = '';
    sendButton.disabled = true;
    appendMessage('user', text);

    // Add loading indicator
    const loadingRow = document.createElement('div');
    loadingRow.className = 'flex w-full justify-start';
    loadingRow.id = 'loading-indicator';
    loadingRow.innerHTML = '<div class="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tr-none shadow"><p class="animate-pulse">جاري التفكير...</p></div>';
    chatContainer.appendChild(loadingRow);
    chatContainer.scrollTop = chatContainer.scrollHeight;

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

        // Remove loading
        document.getElementById('loading-indicator')?.remove();

        if (!response.ok) {
            const errorMessage = data.error?.message || 'حدث خطأ غير معروف.';
            appendMessage('error', `خطأ: ${errorMessage}`);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }
    } catch (error) {
        // Remove loading
        document.getElementById('loading-indicator')?.remove();
        appendMessage('error', `حدث خطأ في الاتصال: ${error.message}`);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
