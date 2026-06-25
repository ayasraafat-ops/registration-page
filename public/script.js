const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const submitButton = chatForm.querySelector('button[type="submit"]');

let conversationHistory = [];

function appendMessage(role, text, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageContent = document.createElement('div');
    messageContent.className = `max-w-[75%] p-4 rounded-lg shadow ${
        role === 'user'
            ? 'bg-blue-100 text-blue-900 rounded-br-none'
            : isError
                ? 'bg-red-100 text-red-900 rounded-bl-none border border-red-300'
                : 'bg-white text-gray-800 rounded-bl-none'
    }`;

    // Use textContent for XSS protection and preserve formatting
    messageContent.style.whiteSpace = 'pre-wrap';
    messageContent.textContent = text;

    messageWrapper.appendChild(messageContent);
    chatContainer.appendChild(messageWrapper);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Disable input and button while waiting
    userInput.disabled = true;
    submitButton.disabled = true;

    // Add user message to UI and history
    appendMessage('user', message);
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
            // Handle error response from server
            const errorMsg = data.error?.message || `HTTP Error ${response.status}`;
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else if (data.choices && data.choices.length > 0) {
            // Handle successful response
            const reply = data.choices[0].message.content;
            appendMessage('assistant', reply);
            conversationHistory.push({ role: 'assistant', content: reply });
        } else {
             appendMessage('assistant', 'خطأ: لم يتم استلام رد صالح من الخادم.', true);
        }

    } catch (error) {
        // Handle network or other fetch errors
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        submitButton.disabled = false;
        userInput.focus();
    }
});
