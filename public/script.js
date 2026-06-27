const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [
    { role: 'system', content: 'أنت مساعد ذكاء اصطناعي مفيد يتحدث باللغة العربية.' }
];

function appendMessage(role, text) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('flex', 'w-full');

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('max-w-[80%]', 'p-3', 'rounded-lg', 'shadow-sm', 'whitespace-pre-wrap');

    // XSS protection: using textContent
    messageBubble.textContent = text;

    if (role === 'user') {
        // User message on the right (RTL default alignment in flex container)
        messageContainer.classList.add('justify-start');
        messageBubble.classList.add('bg-blue-600', 'text-white', 'rounded-tr-none');
    } else if (role === 'assistant') {
        // Assistant message on the left
        messageContainer.classList.add('justify-end');
        messageBubble.classList.add('bg-white', 'text-gray-800', 'border', 'border-gray-200', 'rounded-tl-none');
    } else if (role === 'error') {
        // Error message
        messageContainer.classList.add('justify-center');
        messageBubble.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-400');
    }

    messageContainer.appendChild(messageBubble);
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    userInput.style.height = 'auto'; // Reset height

    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading state
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'loading-indicator';
    loadingMessage.classList.add('flex', 'w-full', 'justify-end');
    const loadingBubble = document.createElement('div');
    loadingBubble.classList.add('max-w-[80%]', 'p-3', 'rounded-lg', 'bg-gray-200', 'text-gray-500', 'animate-pulse');
    loadingBubble.textContent = 'يفكر...';
    loadingMessage.appendChild(loadingBubble);
    chatBox.appendChild(loadingMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading state
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || `Server error: ${response.status}`);
        }

        const assistantMessage = data.choices[0].message.content;
        appendMessage('assistant', assistantMessage);
        conversationHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        // Remove loading state if it exists
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();

        console.error('Error fetching chat response:', error);
        appendMessage('error', `حدث خطأ: ${error.message}`);
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value === '') {
        this.style.height = 'auto';
    }
});
