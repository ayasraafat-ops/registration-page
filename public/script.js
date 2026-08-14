const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'w-full');

    // In RTL, user is justify-start (right), AI is justify-end (left)
    if (role === 'user') {
        messageDiv.classList.add('justify-start');
    } else {
        messageDiv.classList.add('justify-end');
    }

    const bubble = document.createElement('div');
    bubble.classList.add('max-w-xs', 'md:max-w-md', 'p-3', 'rounded-lg', 'message-content');

    if (role === 'user') {
        bubble.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else {
        bubble.classList.add('rounded-tr-none');
        if (isError) {
            bubble.classList.add('bg-red-200', 'text-red-900');
        } else {
            bubble.classList.add('bg-gray-200', 'text-gray-900');
        }
    }

    bubble.textContent = content;
    messageDiv.appendChild(bubble);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;

    return messageDiv;
}

function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.classList.add('flex', 'w-full', 'justify-end');

    const bubble = document.createElement('div');
    bubble.classList.add('p-3', 'rounded-lg', 'bg-gray-200', 'text-gray-500', 'rounded-tr-none');
    bubble.textContent = 'جاري الكتابة...';

    loadingDiv.appendChild(bubble);
    chatContainer.appendChild(loadingDiv);
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function removeLoadingIndicator() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Disable input and button
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Display user message
    appendMessage('user', userMessage);
    conversationHistory.push({ role: 'user', content: userMessage });

    addLoadingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        removeLoadingIndicator();
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else if (data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            appendMessage('assistant', 'لم يتم استلام استجابة صحيحة من الخادم.', true);
        }

    } catch (error) {
        removeLoadingIndicator();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        // Re-enable input and button
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
});