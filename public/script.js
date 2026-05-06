const chatContainer = document.getElementById('chat-container');
const userInputElement = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let messages = [
    { role: 'system', content: 'You are a helpful AI assistant. Respond to users politely.' }
];

// Focus input on load
window.onload = () => {
    userInputElement.focus();
};

// Handle send button click
sendButton.addEventListener('click', handleSendMessage);

// Handle Enter key in input
userInputElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

async function handleSendMessage() {
    const userMessage = userInputElement.value.trim();
    if (!userMessage) return;

    // Clear input
    userInputElement.value = '';

    // Add user message to UI and history
    appendMessage(userMessage, 'user');
    messages.push({ role: 'user', content: userMessage });

    // Show loading indicator
    const loadingId = addLoadingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messages })
        });

        const data = await response.json();

        // Remove loading indicator
        removeElement(loadingId);

        if (response.ok && data.choices && data.choices.length > 0) {
            const assistantMessage = data.choices[0].message.content;
            appendMessage(assistantMessage, 'assistant');
            messages.push({ role: 'assistant', content: assistantMessage });
        } else {
            console.error('API Error:', data);
            appendMessage('عذراً، حدث خطأ أثناء معالجة طلبك.', 'error');
        }

    } catch (error) {
        console.error('Fetch Error:', error);
        removeElement(loadingId);
        appendMessage('عذراً، لا يمكن الاتصال بالخادم الآن.', 'error');
    }
}

function appendMessage(text, role) {
    const messageId = `msg-${Date.now()}`;
    let alignmentClass = '';
    let bgClass = '';
    let textClass = '';

    // RTL layout specific alignment: User left, Assistant right
    if (role === 'user') {
        alignmentClass = 'justify-end';
        bgClass = 'bg-blue-600';
        textClass = 'text-white';
    } else if (role === 'assistant') {
        alignmentClass = 'justify-start';
        bgClass = 'bg-white';
        textClass = 'text-gray-800';
    } else {
        // error
        alignmentClass = 'justify-center';
        bgClass = 'bg-red-100';
        textClass = 'text-red-600';
    }

    const htmlString = `
        <div class="flex ${alignmentClass} w-full" id="${messageId}">
            <div class="${bgClass} ${textClass} rounded-lg p-3 max-w-[80%] shadow-sm ${role === 'assistant' ? 'border border-gray-200' : ''}">
                <p class="message-content text-sm sm:text-base"></p>
            </div>
        </div>
    `;

    chatContainer.insertAdjacentHTML('beforeend', htmlString);

    // Safely insert text using textContent to prevent XSS
    const newElement = document.getElementById(messageId);
    newElement.querySelector('.message-content').textContent = text;

    scrollToBottom();
}

function addLoadingIndicator() {
    const loadingId = `loading-${Date.now()}`;
    const htmlString = `
        <div class="flex justify-start w-full" id="${loadingId}">
            <div class="bg-white text-gray-800 rounded-lg p-3 max-w-[80%] shadow-sm border border-gray-200 flex items-center space-x-2 space-x-reverse">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', htmlString);
    scrollToBottom();
    return loadingId;
}

function removeElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
