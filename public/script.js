const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const submitButton = chatForm.querySelector('button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex';

    // User right (rtl so justify-start in ltr, but since flex row and rtl, we want user on right)
    // Actually in RTL, flex default direction is right-to-left.
    // So 'justify-start' places it on the right. 'justify-end' places it on the left.
    if (role === 'user') {
        messageWrapper.classList.add('justify-start');
    } else {
        messageWrapper.classList.add('justify-end');
    }

    const messageBox = document.createElement('div');
    messageBox.className = 'rounded-lg p-3 max-w-[75%] whitespace-pre-wrap';

    if (isError) {
        messageBox.classList.add('bg-red-200', 'text-red-900', 'error-message');
    } else if (role === 'user') {
        messageBox.classList.add('bg-blue-600', 'text-white', 'user-message');
    } else {
        messageBox.classList.add('bg-gray-200', 'text-gray-900', 'ai-message');
    }

    messageBox.textContent = content; // XSS protection

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Append user message
    appendMessage('user', userMessage);
    conversationHistory.push({ role: 'user', content: userMessage });

    // Clear input and disable button
    messageInput.value = '';
    submitButton.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorText = data.error?.message || 'Unknown error occurred.';
            appendMessage('system', `حدث خطأ: ${errorText}`, true);
        } else if (data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            appendMessage('system', 'لم يتم استلام رد صحيح من الخادم.', true);
        }
    } catch (error) {
        appendMessage('system', `فشل الاتصال بالخادم: ${error.message}`, true);
    } finally {
        submitButton.disabled = false;
        messageInput.focus();
    }
});