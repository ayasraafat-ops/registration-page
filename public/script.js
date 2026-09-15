const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${role === 'user' ? 'bg-blue-600 text-white rounded-tl-none' : isError ? 'bg-red-100 text-red-800 rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tr-none'}`;

    // Use textContent to prevent XSS
    messageDiv.textContent = content;

    wrapper.appendChild(messageDiv);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapper;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendButton.disabled) return;

    userInput.value = '';
    sendButton.disabled = true;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Add temporary loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.innerHTML = `<div class="bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none text-sm">جاري التفكير...</div>`;
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
            throw new Error(data.error || 'حدث خطأ غير معروف');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading indicator if still there
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', `خطأ: ${error.message}`, true);
        // Optionally remove the last user message from history on error, or leave it. We'll leave it.
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});