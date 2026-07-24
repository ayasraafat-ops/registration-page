const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    // In RTL, user messages should be right-aligned (justify-start) and AI left-aligned (justify-end)
    wrapperDiv.className = 'flex ' + (role === 'user' ? 'justify-start' : 'justify-end');

    const messageDiv = document.createElement('div');

    let baseClasses = 'p-3 rounded-lg max-w-[80%] shadow-sm ';
    if (isError) {
        baseClasses += 'bg-red-200 text-red-900';
    } else if (role === 'user') {
        baseClasses += 'bg-green-100 text-gray-800';
    } else {
        baseClasses += 'bg-blue-100 text-gray-800';
    }

    messageDiv.className = baseClasses;
    // Prevent XSS by using textContent and style with pre-wrap for formatting
    messageDiv.textContent = content;
    messageDiv.style.whiteSpace = 'pre-wrap';

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Allow sending with Enter key, but Shift+Enter for new line
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear input
    userInput.value = '';

    // Display user message
    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Display temporary loading message
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-end';
    loadingWrapper.id = 'loading-indicator';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'p-3 rounded-lg max-w-[80%] shadow-sm bg-gray-200 text-gray-600 italic';
    loadingDiv.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingDiv);
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
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();

        if (!response.ok) {
            const errorMessage = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
            return;
        }

        const aiMessage = data.choices[0].message.content;

        // Display AI message
        appendMessage('assistant', aiMessage);

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading indicator
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();

        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    }
}
