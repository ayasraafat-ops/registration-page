const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Keep track of conversation history for context
let conversationHistory = [];

function appendMessage(role, content) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('flex');

    // In RTL, user is left (justify-end because row-reverse logic in RTL flex, actually user should be left, assistant right.
    // Let's stick to memory: user aligned left using `justify-end` and assistant aligned right using `justify-start`
    if (role === 'user') {
        messageContainer.classList.add('justify-end');
    } else {
        messageContainer.classList.add('justify-start');
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('p-3', 'rounded-lg', 'max-w-[75%]', 'shadow-sm');

    // Apply role-specific styling and directional tails
    if (role === 'user') {
        messageBubble.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else if (role === 'assistant') {
        messageBubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    } else if (role === 'error') {
        messageBubble.classList.add('bg-red-200', 'text-red-800', 'rounded-tr-none');
    }

    // Set text content with pre-wrap for XSS protection
    messageBubble.style.whiteSpace = 'pre-wrap';
    messageBubble.textContent = content;

    messageContainer.appendChild(messageBubble);
    chatMessages.appendChild(messageContainer);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    // Disable input and button while sending
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Reset textarea height
    messageInput.style.height = 'auto';

    // Add user message to UI and history
    appendMessage('user', content);
    conversationHistory.push({ role: 'user', content: content });

    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingContainer = document.createElement('div');
    loadingContainer.id = loadingId;
    loadingContainer.classList.add('flex', 'justify-start');
    loadingContainer.innerHTML = `
        <div class="bg-gray-100 text-gray-500 rounded-lg p-3 rounded-tr-none flex items-center space-x-2 space-x-reverse">
            <span class="animate-bounce">.</span>
            <span class="animate-bounce" style="animation-delay: 0.2s">.</span>
            <span class="animate-bounce" style="animation-delay: 0.4s">.</span>
        </div>
    `;
    chatMessages.appendChild(loadingContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;

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
            throw new Error(data.error?.message || "حدث خطأ غير معروف");
        }

        const aiContent = data.choices && data.choices[0] && data.choices[0].message.content;

        if (aiContent) {
            appendMessage('assistant', aiContent);
            conversationHistory.push({ role: 'assistant', content: aiContent });
        } else {
            throw new Error("استجابة غير صالحة من الخادم");
        }

    } catch (error) {
        document.getElementById(loadingId)?.remove();
        appendMessage('error', 'خطأ: ' + error.message);
        // Remove the last user message from history so they can try again
        conversationHistory.pop();
    } finally {
        // Re-enable input and button
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value.trim() === '') {
        this.style.height = 'auto';
    }
});
