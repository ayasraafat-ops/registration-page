const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value === '') {
        this.style.height = 'auto';
    }
});

function addMessageToUI(content, isUser) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `p-3 rounded-lg shadow max-w-3xl ${
        isUser
            ? 'bg-blue-600 text-white rounded-tl-none'
            : 'bg-white text-gray-800 rounded-tr-none'
    }`;

    const messageText = document.createElement('p');
    messageText.className = 'message-content';
    // Use textContent to prevent XSS
    messageText.textContent = content;

    messageBox.appendChild(messageText);
    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex justify-start mb-4';
    wrapper.id = 'loading-indicator';

    const messageBox = document.createElement('div');
    messageBox.className = 'bg-white text-gray-800 p-3 rounded-lg rounded-tr-none shadow max-w-3xl flex items-center gap-2';

    // Simple pulsing dots animation
    messageBox.innerHTML = `
        <i class="fas fa-circle-notch fa-spin text-blue-500"></i>
        <span>جاري التفكير...</span>
    `;

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Reset input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();

    // Add user message to UI
    addMessageToUI(text, true);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading
    addLoadingIndicator();

    // Disable input while processing
    messageInput.disabled = true;
    sendButton.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;

            // Add to history
            conversationHistory.push({ role: 'assistant', content: aiMessage });

            // Remove loading and add AI message
            removeLoadingIndicator();
            addMessageToUI(aiMessage, false);
        } else {
            throw new Error(data.error || 'حدث خطأ غير متوقع');
        }

    } catch (error) {
        removeLoadingIndicator();
        addMessageToUI(`عذراً، حدث خطأ: ${error.message}`, false);
        // Remove the failed user message from history so they can try again
        conversationHistory.pop();
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
