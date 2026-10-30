const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-tl-none'
            : 'bg-gray-200 text-gray-800 rounded-tr-none'
    }`;

    // Prevent XSS
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendError(content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex justify-center';

    const messageBox = document.createElement('div');
    messageBox.className = 'p-2 bg-red-100 text-red-600 rounded-lg text-sm whitespace-pre-wrap';

    // Prevent XSS
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || sendButton.disabled) return;

    // Add user message to UI
    appendMessage('user', text);
    messageInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Disable input while loading
    sendButton.disabled = true;
    messageInput.disabled = true;

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.innerHTML = `<div class="p-3 bg-gray-200 text-gray-500 rounded-lg rounded-tr-none text-sm">جاري التفكير...</div>`;
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
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير متوقع');
        }

        const aiMessage = data.choices[0].message.content;

        // Add AI message to UI
        appendMessage('assistant', aiMessage);

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading indicator if still there
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        appendError(`خطأ: ${error.message}`);
        // Remove last user message from history on failure so they can try again
        conversationHistory.pop();
    } finally {
        // Re-enable input
        sendButton.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
