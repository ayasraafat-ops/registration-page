const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let messages = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex', 'mb-4');

    // In RTL, user should be on the right (justify-start), AI on the left (justify-end)
    if (role === 'user') {
        wrapper.classList.add('justify-start');
    } else {
        wrapper.classList.add('justify-end');
    }

    const messageBox = document.createElement('div');
    messageBox.classList.add('max-w-[70%]', 'p-3', 'rounded-lg', 'shadow-sm');
    messageBox.style.whiteSpace = 'pre-wrap';

    if (role === 'user') {
        messageBox.classList.add('bg-blue-600', 'text-white', 'rounded-tr-none');
    } else {
        if (isError) {
            messageBox.classList.add('bg-red-200', 'text-red-900', 'rounded-tl-none');
        } else {
            messageBox.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tl-none');
        }
    }

    messageBox.textContent = content; // XSS protection
    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Add user message to UI
    appendMessage('user', userMessage);
    messages.push({ role: 'user', content: userMessage });

    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Show temporary loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.classList.add('flex', 'mb-4', 'justify-end');
    const loadingBox = document.createElement('div');
    loadingBox.classList.add('max-w-[70%]', 'p-3', 'rounded-lg', 'bg-gray-100', 'text-gray-500', 'rounded-tl-none');
    loadingBox.textContent = 'جاري الكتابة...';
    loadingWrapper.appendChild(loadingBox);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();

        // Remove loading indicator
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'Unknown error from server.';
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
            // Don't add error to messages history
        } else if (data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            messages.push({ role: 'assistant', content: aiMessage });
        } else {
            appendMessage('assistant', 'عذراً، استجابة غير متوقعة من الخادم.', true);
        }
    } catch (error) {
        // Remove loading indicator
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();

        appendMessage('assistant', `عذراً، حدث خطأ في الاتصال: ${error.message}`, true);
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
});
