const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const errorMessageDiv = document.getElementById('error-message');
const sendButton = document.getElementById('send-button');

// Store conversation history for context
let conversationHistory = [];

function showError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
    setTimeout(() => {
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.textContent = '';
    }, 5000);
}

function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add('flex', 'mb-4');

    // In RTL: justify-end moves item to the left (User), justify-start keeps it on the right (AI)
    if (role === 'user') {
        wrapperDiv.classList.add('justify-end');
    } else {
        wrapperDiv.classList.add('justify-start');
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('p-3', 'rounded-lg', 'shadow-sm', 'max-w-[80%]', 'whitespace-pre-wrap');

    if (role === 'user') {
        messageDiv.classList.add('bg-blue-100', 'text-blue-900', 'border', 'border-blue-200');
    } else {
        messageDiv.classList.add('bg-white', 'text-gray-800', 'border', 'border-gray-200');
    }

    // XSS protection: using textContent instead of innerHTML
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Disable input and button while loading
    userInput.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = 'جاري...';

    // Add user message to UI
    appendMessage('user', message);

    // Update history
    conversationHistory.push({ role: 'user', content: message });

    userInput.value = '';

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
            throw new Error(data.error?.message || 'حدث خطأ أثناء الاتصال بالخادم.');
        }

        const aiReply = data.choices[0].message.content;

        // Update history with AI reply
        conversationHistory.push({ role: 'assistant', content: aiReply });

        // Add AI message to UI
        appendMessage('assistant', aiReply);

    } catch (error) {
        showError(error.message);
        // Remove the user message from history if the request failed
        conversationHistory.pop();
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = 'إرسال';
        userInput.focus();
    }
});