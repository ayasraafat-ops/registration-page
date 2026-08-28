const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [
    { role: 'system', content: 'You are a helpful AI assistant.' }
];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    // In RTL, user messages are on the right (justify-start), assistant on the left (justify-end)
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageDiv = document.createElement('div');

    let baseClasses = "p-3 rounded-lg max-w-xs md:max-w-md shadow-sm whitespace-pre-wrap ";
    if (isError) {
        baseClasses += "bg-red-200 text-red-900";
    } else if (role === 'user') {
        baseClasses += "bg-green-100 text-green-900";
    } else {
        baseClasses += "bg-gray-200 text-gray-900";
    }
    messageDiv.className = baseClasses;

    // XSS protection
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapperDiv; // Return in case we need to remove it (like loading indicator)
}

async function sendMessage() {
    if (sendButton.disabled) return;

    const text = messageInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    messageInput.value = '';
    sendButton.disabled = true;

    // Show loading
    const loadingMessage = appendMessage('assistant', 'جاري التفكير...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading message
        chatContainer.removeChild(loadingMessage);

        if (!response.ok) {
            const errorMsg = data.error || 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else {
            const reply = data.choices[0].message.content;
            appendMessage('assistant', reply);
            conversationHistory.push({ role: 'assistant', content: reply });
        }
    } catch (error) {
        chatContainer.removeChild(loadingMessage);
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
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
