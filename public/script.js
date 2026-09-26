const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('flex', 'w-full');

    // RTL layout: User messages to the left, AI to the right
    if (role === 'user') {
        messageContainer.classList.add('justify-end');
    } else {
        messageContainer.classList.add('justify-start');
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('rounded-lg', 'p-3', 'max-w-[80%]', 'break-words');

    if (isError) {
        messageBubble.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-300');
    } else if (role === 'user') {
        messageBubble.classList.add('bg-indigo-600', 'text-white', 'rounded-tl-none');
    } else {
        messageBubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    }

    const messageText = document.createElement('p');
    messageText.style.whiteSpace = 'pre-wrap';
    // XSS Protection: Use textContent
    messageText.textContent = content;

    messageBubble.appendChild(messageText);
    messageContainer.appendChild(messageBubble);
    chatBox.appendChild(messageContainer);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoading() {
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'loadingIndicator';
    loadingContainer.classList.add('flex', 'justify-start', 'w-full');

    const loadingBubble = document.createElement('div');
    loadingBubble.classList.add('bg-gray-100', 'text-gray-500', 'rounded-lg', 'p-3', 'rounded-tr-none', 'italic');
    loadingBubble.textContent = 'جاري التفكير...';

    loadingContainer.appendChild(loadingBubble);
    chatBox.appendChild(loadingContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while sending
    userInput.value = '';
    sendButton.disabled = true;
    userInput.disabled = true;

    appendMessage('user', text);

    conversationHistory.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            const errorMsg = data.error?.message || `خطأ غير معروف (الرمز: ${response.status})`;
            appendMessage('assistant', `حدث خطأ: ${errorMsg}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `حدث خطأ في الاتصال بالخادم: ${error.message}`, true);
    } finally {
        // Re-enable input
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});
