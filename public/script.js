const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');

    let baseClasses = 'max-w-[75%] rounded-lg p-3 ';
    if (role === 'user') {
        baseClasses += 'bg-blue-600 text-white';
    } else {
        baseClasses += isError ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800';
    }

    messageBox.className = baseClasses;
    // XSS protection and preserve whitespace
    messageBox.style.whiteSpace = 'pre-wrap';
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    // Clear input
    messageInput.value = '';

    // Add user message to UI and history
    appendMessage('user', content);
    conversationHistory.push({ role: 'user', content: content });

    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-end';

    const loadingBox = document.createElement('div');
    loadingBox.className = 'max-w-[75%] rounded-lg p-3 bg-gray-200 text-gray-800 italic';
    loadingBox.textContent = 'جاري التفكير...';

    loadingWrapper.appendChild(loadingBox);
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
            const errorMessage = data.error?.message || 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
        } else {
            const aiMessage = data.choices?.[0]?.message?.content || 'لم يتم استلام أي استجابة.';
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
