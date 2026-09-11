document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [
        { role: 'system', content: 'You are a helpful assistant. You speak Arabic.' }
    ];

    function appendMessage(role, content, isError = false) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

        const messageBubble = document.createElement('div');

        // Base styling for bubbles
        messageBubble.className = 'rounded-lg p-3 max-w-[80%] break-words whitespace-pre-wrap ';

        if (isError) {
            messageBubble.className += 'bg-red-100 text-red-800 ';
        } else if (role === 'user') {
            messageBubble.className += 'bg-blue-600 text-white rounded-tl-none ';
        } else {
            messageBubble.className += 'bg-gray-200 text-gray-800 rounded-tr-none ';
        }

        // Set textContent to prevent XSS
        messageBubble.textContent = content;

        messageContainer.appendChild(messageBubble);
        chatMessages.appendChild(messageContainer);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return messageContainer;
    }

    function addLoadingIndicator() {
        const container = document.createElement('div');
        container.className = 'flex justify-start';
        container.id = 'loading-indicator';

        const bubble = document.createElement('div');
        bubble.className = 'bg-gray-200 text-gray-800 rounded-lg p-3 rounded-tr-none flex items-center gap-2';

        const dot1 = document.createElement('div');
        dot1.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
        dot1.style.animationDelay = '0ms';

        const dot2 = document.createElement('div');
        dot2.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
        dot2.style.animationDelay = '150ms';

        const dot3 = document.createElement('div');
        dot3.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
        dot3.style.animationDelay = '300ms';

        bubble.appendChild(dot1);
        bubble.appendChild(dot2);
        bubble.appendChild(dot3);

        container.appendChild(bubble);
        chatMessages.appendChild(container);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeLoadingIndicator() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.remove();
        }
    }

    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return;

        // Disable input while sending
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        appendMessage('user', messageText);
        conversationHistory.push({ role: 'user', content: messageText });

        addLoadingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            removeLoadingIndicator();

            if (!response.ok) {
                const errorMsg = data.error || 'حدث خطأ غير متوقع';
                appendMessage('system', errorMsg, true);
            } else if (data.choices && data.choices[0] && data.choices[0].message) {
                const assistantMessage = data.choices[0].message.content;
                appendMessage('assistant', assistantMessage);
                conversationHistory.push({ role: 'assistant', content: assistantMessage });
            } else {
                 appendMessage('system', 'استجابة غير صالحة من الخادم', true);
            }

        } catch (error) {
            removeLoadingIndicator();
            appendMessage('system', `خطأ في الاتصال: ${error.message}`, true);
        } finally {
            // Re-enable input
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            e.preventDefault();
            sendMessage();
        }
    });
});
