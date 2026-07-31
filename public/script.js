const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

// RTL layout: User messages to the right (justify-start in RTL), Assistant to the left (justify-end in RTL)
function appendMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'w-full');

    // In RTL, justify-start puts it on the right, justify-end puts it on the left
    if (role === 'user') {
        messageDiv.classList.add('justify-start');
    } else {
        messageDiv.classList.add('justify-end');
    }

    const bubble = document.createElement('div');
    bubble.classList.add('max-w-[75%]', 'rounded-lg', 'p-3', 'message-content');

    if (role === 'user') {
        bubble.classList.add('bg-blue-600', 'text-white', 'rounded-br-none');
    } else if (role === 'assistant') {
        bubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-bl-none');
    } else if (role === 'error') {
        bubble.classList.add('bg-red-200', 'text-red-800', 'rounded-bl-none');
    }

    bubble.textContent = text; // XSS protection

    messageDiv.appendChild(bubble);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = messageInput.value.trim();
    if (!userText) return;

    // Disable input while processing
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Add user message to UI
    appendMessage('user', userText);

    // Update conversation history
    conversationHistory.push({ role: 'user', content: userText });

    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.classList.add('flex', 'w-full', 'justify-end');
    const loadingBubble = document.createElement('div');
    loadingBubble.classList.add('max-w-[75%]', 'rounded-lg', 'p-3', 'bg-gray-200', 'text-gray-500', 'italic');
    loadingBubble.textContent = 'جارٍ التفكير...';
    loadingDiv.appendChild(loadingBubble);
    chatContainer.appendChild(loadingDiv);
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
            throw new Error(data.error?.message || 'حدث خطأ في الخادم');
        }

        const aiResponseText = data.choices[0].message.content;

        // Add AI message to UI
        appendMessage('assistant', aiResponseText);

        // Update history
        conversationHistory.push({ role: 'assistant', content: aiResponseText });

    } catch (error) {
        // Remove loading indicator if still there
        document.getElementById(loadingId)?.remove();

        console.error('Error:', error);
        // Show specific error message in UI
        appendMessage('error', `عذراً، حدث خطأ: ${error.message}`);

        // Optionally remove the last user message from history so they can retry
        conversationHistory.pop();
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
});
