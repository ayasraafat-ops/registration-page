document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    // Conversation history to send to API
    let conversationHistory = [];

    // Function to append a message to the UI
    function appendMessage(role, content, isError = false) {
        const msgWrapper = document.createElement('div');
        msgWrapper.classList.add('flex');

        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.classList.add('p-4', 'rounded-lg', 'shadow-sm', 'max-w-[80%]', 'border');

        const textElement = document.createElement('p');
        textElement.classList.add('msg-content');
        // Securely set text content to avoid XSS
        textElement.textContent = content;

        if (role === 'user') {
            msgWrapper.classList.add('justify-end');
            bubbleWrapper.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tl-none', 'border-blue-200');
        } else {
            msgWrapper.classList.add('justify-start');
            if (isError) {
                bubbleWrapper.classList.add('bg-red-100', 'text-red-900', 'rounded-tr-none', 'border-red-200');
            } else {
                bubbleWrapper.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none', 'border-gray-300');
            }
        }

        bubbleWrapper.appendChild(textElement);
        msgWrapper.appendChild(bubbleWrapper);
        chatContainer.appendChild(msgWrapper);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return msgWrapper; // Return the wrapper to manipulate later (e.g. remove loading)
    }

    // Function to handle message submission
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Disable input while processing
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;

        // Add user message to UI and history
        appendMessage('user', message);
        conversationHistory.push({ role: 'user', content: message });

        // Add loading indicator
        const loadingBubble = appendMessage('assistant', 'جاري التفكير...');

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
            loadingBubble.remove();

            if (!response.ok) {
                const errorMsg = data.error?.message || "حدث خطأ غير معروف.";
                appendMessage('assistant', `خطأ: ${errorMsg}`, true);
                // Optionally remove the last user message from history if it failed
                // conversationHistory.pop();
            } else {
                const aiMessage = data.choices?.[0]?.message?.content;
                if (aiMessage) {
                    appendMessage('assistant', aiMessage);
                    conversationHistory.push({ role: 'assistant', content: aiMessage });
                } else {
                    appendMessage('assistant', 'عذراً، لم أتمكن من الحصول على رد صحيح.', true);
                }
            }

        } catch (error) {
            loadingBubble.remove();
            appendMessage('assistant', `تعذر الاتصال بالخادم: ${error.message}`, true);
        } finally {
            // Re-enable input
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    // Event listeners
    sendButton.addEventListener('click', () => {
        if (!sendButton.disabled) {
            sendMessage();
        }
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            sendMessage();
        }
    });

    // Initial focus
    messageInput.focus();
});