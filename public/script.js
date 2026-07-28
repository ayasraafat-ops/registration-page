const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const submitBtn = document.getElementById('submit-btn');
const loadingIndicator = document.getElementById('loading-indicator');
const errorContainer = document.getElementById('error-container');

// Keep track of the conversation history
let conversationHistory = [];

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000);
}

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex', 'mb-2');

    // Setup alignment based on role (User messages are on the right in RTL, AI on the left)
    if (role === 'user') {
        messageWrapper.classList.add('justify-start');
    } else {
        messageWrapper.classList.add('justify-end');
    }

    const messageContent = document.createElement('div');
    messageContent.classList.add('p-3', 'rounded-lg', 'max-w-[80%]', 'break-words');

    // Apply role-specific colors
    if (role === 'user') {
        messageContent.classList.add('bg-blue-100', 'text-blue-900', 'border', 'border-blue-200');
    } else if (role === 'error') {
        messageContent.classList.add('bg-red-200', 'text-red-900');
    } else {
        messageContent.classList.add('bg-gray-200', 'text-gray-800');
    }

    // Set textContent to prevent XSS
    messageContent.textContent = content;
    // Keep line breaks
    messageContent.style.whiteSpace = 'pre-wrap';

    messageWrapper.appendChild(messageContent);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setLoading(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        loadingIndicator.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        loadingIndicator.classList.add('hidden');
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Clear input
    userInput.value = '';

    // Hide previous errors
    errorContainer.classList.add('hidden');

    // Add user message to UI and history
    appendMessage('user', message);
    conversationHistory.push({ role: 'user', content: message });

    setLoading(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || 'حدث خطأ في الاتصال بالخادم';
            throw new Error(errorMsg);
        }

        const aiMessage = data.choices?.[0]?.message?.content || 'لم يتم استلام رد صحيح من الخادم';

        // Add AI message to UI and history
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        console.error('Chat Error:', error);
        showError(`خطأ: ${error.message}`);
        appendMessage('error', 'عذراً، حدث خطأ أثناء معالجة طلبك.');
        // Optionally remove the last user message from history if the request failed completely
        conversationHistory.pop();
    } finally {
        setLoading(false);
        // Put focus back on input
        userInput.focus();
    }
});