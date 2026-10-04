const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, text, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');

    let bubbleClass = 'p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-xl whitespace-pre-wrap ';
    if (role === 'user') {
        bubbleClass += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        bubbleClass += isError ? 'bg-red-100 text-red-800 rounded-tr-none border border-red-300' : 'bg-gray-200 text-gray-800 rounded-tr-none';
    }

    messageBubble.className = bubbleClass;
    messageBubble.textContent = text; // Prevents XSS

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sendButton.disabled) return;

    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    userInput.value = '';
    sendButton.disabled = true;

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start mb-4';
    loadingWrapper.innerHTML = `<div class="bg-gray-100 text-gray-500 p-3 rounded-lg rounded-tr-none italic text-sm">جاري التفكير...</div>`;
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
            const errorMessage = data.error || 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
        } else {
            const aiText = data.choices[0].message.content;
            appendMessage('assistant', aiText);
            conversationHistory.push({ role: 'assistant', content: aiText });
        }
    } catch (error) {
        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
});

// Handle enter key press specifically if needed (form submit usually handles it)
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});