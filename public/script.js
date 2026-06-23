const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');
const errorMessageDiv = document.getElementById('error-message');

let messages = [
    { role: "system", content: "أنت مساعد ذكاء اصطناعي مفيد يتحدث باللغة العربية." }
];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    // In RTL, user is right (justify-start), assistant is left (justify-end)
    messageWrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = `p-3 rounded-lg shadow max-w-[80%] ${
        role === 'user'
        ? 'bg-blue-100 text-blue-900 rounded-tl-none'
        : 'bg-white text-gray-800 rounded-tr-none'
    }`;

    const messageText = document.createElement('p');
    messageText.className = 'message-content';
    // Use textContent for XSS protection
    messageText.textContent = content;

    messageBubble.appendChild(messageText);
    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
}

function hideError() {
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Add user message to UI and history
    appendMessage('user', userMessage);
    messages.push({ role: "user", content: userMessage });

    // Clear input and disable button
    messageInput.value = '';
    sendButton.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error?.message || "حدث خطأ غير معروف أثناء الاتصال بالخادم.");
        }

        const assistantMessage = data.choices[0].message.content;

        // Add assistant message to UI and history
        appendMessage('assistant', assistantMessage);
        messages.push({ role: "assistant", content: assistantMessage });

    } catch (error) {
        showError(`خطأ: ${error.message}`);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
});
