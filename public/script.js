const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let messagesHistory = [];

function addMessageToUI(role, content) {
    const isUser = role === 'user';

    // Create unique ID for the text container to safely inject text content
    const textId = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 9);

    // Use tailwind classes for RTL alignment: user text on left (justify-end), AI on right (justify-start)
    const alignClass = isUser ? 'justify-end' : 'justify-start';
    const bgClass = isUser ? 'bg-blue-100' : 'bg-gray-100';
    const borderClass = isUser ? 'border-blue-200' : 'border-gray-200';

    const htmlTemplate = `
        <div class="flex ${alignClass} w-full">
            <div class="max-w-[80%] rounded-lg p-3 border ${bgClass} ${borderClass}">
                <p id="${textId}" style="white-space: pre-wrap;" class="text-sm sm:text-base text-gray-800"></p>
            </div>
        </div>
    `;

    chatContainer.insertAdjacentHTML('beforeend', htmlTemplate);

    // XSS Protection: safely set textContent
    const textElement = document.getElementById(textId);
    if (textElement) {
        textElement.textContent = content;
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingIndicator() {
    const loadingId = 'loading-indicator';
    const htmlTemplate = `
        <div id="${loadingId}" class="flex justify-start w-full">
            <div class="max-w-[80%] rounded-lg p-3 border bg-gray-100 border-gray-200 flex items-center gap-2">
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', htmlTemplate);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return loadingId;
}

function removeLoadingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    // Add user message to UI and history
    addMessageToUI('user', content);
    messagesHistory.push({ role: 'user', content });

    // Clear input
    messageInput.value = '';

    // Show loading indicator
    const loadingId = addLoadingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messagesHistory })
        });

        const data = await response.json();

        removeLoadingIndicator(loadingId);

        if (response.ok && data.choices && data.choices.length > 0) {
            const aiContent = data.choices[0].message.content;
            addMessageToUI('assistant', aiContent);
            messagesHistory.push({ role: 'assistant', content: aiContent });
        } else {
            addMessageToUI('assistant', 'عذراً، حدث خطأ أثناء معالجة الطلب.');
            console.error('API Error:', data.error);
        }
    } catch (error) {
        removeLoadingIndicator(loadingId);
        addMessageToUI('assistant', 'عذراً، حدث خطأ في الاتصال بالخادم.');
        console.error('Fetch Error:', error);
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
