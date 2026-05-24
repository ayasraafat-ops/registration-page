document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto';
        }
    });

    // Handle Enter key (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Add user message to UI
        appendMessage(text, 'user');

        // Add to history
        conversationHistory.push({ role: 'user', content: text });

        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Show loading state
        const loadingId = appendMessage('...', 'assistant', true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            // Remove loading message
            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'حدث خطأ غير معروف');
            }

            if (data.choices && data.choices.length > 0) {
                const assistantMessage = data.choices[0].message.content;
                appendMessage(assistantMessage, 'assistant');
                conversationHistory.push({ role: 'assistant', content: assistantMessage });
            } else {
                throw new Error('استجابة غير صالحة من الخادم');
            }

        } catch (error) {
            // Remove loading message if still there
            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();

            console.error('Error:', error);
            appendMessage(`حدث خطأ: ${error.message}`, 'error');
        }
    }

    function appendMessage(text, sender, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex ' + (sender === 'user' ? 'justify-end' : 'justify-start');

        const messageId = 'msg-' + Date.now();
        if (isLoading) {
            messageDiv.id = messageId;
        }

        const innerDiv = document.createElement('div');

        // Determine styling based on sender
        if (sender === 'user') {
            innerDiv.className = 'bg-blue-600 text-white rounded-lg p-3 max-w-[80%] shadow';
        } else if (sender === 'error') {
            innerDiv.className = 'bg-red-100 text-red-800 rounded-lg p-3 max-w-[80%] shadow border border-red-300';
        } else {
            innerDiv.className = 'bg-gray-200 text-gray-800 rounded-lg p-3 max-w-[80%] shadow';
            if (isLoading) {
                innerDiv.classList.add('animate-pulse');
            }
        }

        // Use textContent for XSS protection, and white-space pre-wrap for formatting
        innerDiv.style.whiteSpace = 'pre-wrap';
        innerDiv.textContent = text;

        messageDiv.appendChild(innerDiv);
        chatContainer.appendChild(messageDiv);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageId;
    }
});
