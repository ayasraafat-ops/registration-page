let chatHistory = [];

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const messageText = inputField.value.trim();

    if (!messageText) return;

    // Add user message to UI
    appendMessage('user', messageText);
    inputField.value = '';

    // Add user message to history
    chatHistory.push({ role: 'user', content: messageText });

    // Show loading indicator
    const loadingId = appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });

        removeLoading(loadingId);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
            chatHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            appendMessage('system', 'حدث خطأ غير متوقع في الرد.');
        }

    } catch (error) {
        console.error('Error:', error);
        removeLoading(loadingId);
        appendMessage('system', 'عذراً، حدث خطأ أثناء الاتصال بالخادم.');
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function appendMessage(role, text) {
    const chatContainer = document.getElementById('chat-container');
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = `max-w-[75%] p-3 rounded-lg whitespace-pre-wrap ${
        role === 'user' ? 'bg-blue-600 text-white rounded-br-none' :
        role === 'assistant' ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm' :
        'bg-red-100 text-red-700 w-full text-center'
    }`;

    // Prevent XSS
    messageBubble.textContent = text;

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function appendLoading() {
    const chatContainer = document.getElementById('chat-container');
    const messageWrapper = document.createElement('div');
    const loadingId = 'loading-' + Date.now();
    messageWrapper.id = loadingId;
    messageWrapper.className = `flex w-full justify-start`;

    const messageBubble = document.createElement('div');
    messageBubble.className = `max-w-[75%] p-3 rounded-lg bg-white border border-gray-200 text-gray-500 rounded-bl-none shadow-sm flex gap-1 items-center`;

    messageBubble.innerHTML = `
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
    `;

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;

    return loadingId;
}

function removeLoading(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}
