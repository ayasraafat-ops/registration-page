let conversationHistory = [
    { role: "system", content: "أنت مساعد ذكاء اصطناعي مفيد. أجب باللغة العربية." }
];

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');

    let bubbleClasses = 'rounded-lg p-3 max-w-[80%] whitespace-pre-wrap ';
    if (role === 'user') {
        bubbleClasses += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        bubbleClasses += isError
            ? 'bg-red-100 text-red-800 rounded-tr-none'
            : 'bg-gray-200 text-gray-800 rounded-tr-none';
    }

    messageBubble.className = bubbleClasses;
    // XSS Protection: use textContent instead of innerHTML
    messageBubble.textContent = content;

    messageWrapper.appendChild(messageBubble);
    chatMessages.appendChild(messageWrapper);

    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendButton.disabled) return;

    // Prevent duplicate submissions
    sendButton.disabled = true;
    userInput.disabled = true;

    // Display user message
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Clear input
    userInput.value = '';

    // Show loading state
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.className = 'flex justify-start';
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'bg-gray-200 text-gray-500 rounded-lg p-3 rounded-tr-none';
    loadingBubble.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingBubble);
    chatMessages.appendChild(loadingWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

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
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.remove();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
        }

        const aiResponse = data.choices[0].message.content;
        appendMessage('assistant', aiResponse);
        conversationHistory.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.remove();

        appendMessage('assistant', `خطأ: ${error.message}`, true);
        // Remove the user message from history so they can try again
        conversationHistory.pop();
    } finally {
        // Re-enable inputs
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
}
