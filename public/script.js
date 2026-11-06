let conversationHistory = [];

const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const errorMessage = document.getElementById('error-message');

function appendMessage(role, text) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
        role === 'user'
        ? 'bg-blue-600 text-white rounded-tl-none'
        : role === 'error'
        ? 'bg-red-100 text-red-800 rounded-tr-none'
        : 'bg-gray-200 text-gray-800 rounded-tr-none'
    }`;

    // XSS protection: using textContent
    messageDiv.textContent = text;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (sendButton.disabled) return;

    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    userInput.value = '';

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.innerHTML = `<div class="bg-gray-200 text-gray-600 p-3 rounded-lg rounded-tr-none animate-pulse">جاري التفكير...</div>`;
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
        document.getElementById(loadingId)?.remove();

        if (!response.ok) {
            const errorText = data.error || 'حدث خطأ غير متوقع.';
            appendMessage('error', `عذراً، حدث خطأ: ${errorText}`);
            // Remove the last user message from history since it failed
            conversationHistory.pop();
            return;
        }

        const aiResponseText = data.choices[0].message.content;

        // Add AI response to UI and history
        appendMessage('assistant', aiResponseText);
        conversationHistory.push({ role: 'assistant', content: aiResponseText });

    } catch (error) {
        document.getElementById(loadingId)?.remove();
        console.error('Fetch error:', error);
        appendMessage('error', 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.');
        // Remove the last user message from history since it failed
        conversationHistory.pop();
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
});

// Handle enter key to submit (but form submit handles it anyway, this is for textarea if we change it later, keeping for completeness but checking disabled state)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            chatForm.dispatchEvent(new Event('submit'));
        }
    }
});
