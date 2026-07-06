const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');

// Conversation history
let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex');

    // RTL layout: user aligns right (justify-start), AI aligns left (justify-end)
    if (role === 'user') {
        messageWrapper.classList.add('justify-start');
    } else {
        messageWrapper.classList.add('justify-end');
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('rounded-lg', 'p-3', 'max-w-[80%]', 'whitespace-pre-wrap');

    if (role === 'user') {
        messageBubble.classList.add('bg-blue-100', 'text-blue-900', 'border', 'border-blue-200');
    } else if (role === 'error') {
        messageBubble.classList.add('bg-red-100', 'text-red-900', 'border', 'border-red-200');
    } else {
        // AI / system
        messageBubble.classList.add('bg-gray-200', 'text-gray-800');
    }

    // Set textContent to prevent XSS
    messageBubble.textContent = content;

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageWrapper;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Display user message
    appendMessage('user', text);
    userInput.value = '';
    sendButton.disabled = true;

    // Update history
    conversationHistory.push({ role: 'user', content: text });

    // Show temporary loading indicator
    const loadingWrapper = appendMessage('assistant', 'جاري الكتابة...');
    loadingWrapper.id = 'loading-indicator';

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
        chatContainer.removeChild(loadingWrapper);

        if (!response.ok) {
            // Display specific technical error
            const errorMessage = data.error?.message || `Error ${response.status}: Failed to get response.`;
            appendMessage('error', 'خطأ: ' + errorMessage);
            return;
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);

        // Update history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        chatContainer.removeChild(loadingWrapper);
        appendMessage('error', 'حدث خطأ في الاتصال: ' + error.message);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
});