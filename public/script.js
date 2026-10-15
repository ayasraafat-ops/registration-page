const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, text) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');
    // Using rounded-tl-none for user (left side of bubble has tail due to RTL)
    // Using rounded-tr-none for assistant (right side of bubble has tail due to RTL)
    const baseClasses = "p-3 rounded-lg shadow max-w-[80%]";
    const userClasses = "bg-blue-100 rounded-tl-none";
    const assistantClasses = "bg-white rounded-tr-none";

    if (role === 'user') {
        messageBox.className = `${baseClasses} ${userClasses}`;
    } else if (role === 'error') {
         messageBox.className = `${baseClasses} bg-red-100 rounded-tr-none text-red-700`;
    } else {
        messageBox.className = `${baseClasses} ${assistantClasses}`;
    }

    const messageText = document.createElement('p');
    messageText.className = "whitespace-pre-wrap";
    messageText.textContent = text; // Safe rendering

    messageBox.appendChild(messageText);
    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button while processing
    userInput.value = '';
    sendButton.disabled = true;
    userInput.disabled = true;

    // Append user message to UI
    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading state
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.innerHTML = `<div class="bg-gray-200 p-3 rounded-lg rounded-tr-none shadow text-gray-500">جاري التفكير...</div>`;
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();

        if (response.ok) {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            const errorMessage = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('error', `عذراً، حدث خطأ: ${errorMessage}`);
        }

    } catch (error) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();

        appendMessage('error', `خطأ في الاتصال: ${error.message}`);
    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});
