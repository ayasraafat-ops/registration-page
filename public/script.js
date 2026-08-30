document.addEventListener('DOMContentLoaded', () => {
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

    function appendMessage(role, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex ' + (role === 'user' ? 'justify-start' : 'justify-end');

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `p-3 max-w-[80%] rounded-lg ${
            role === 'user'
                ? 'bg-indigo-600 text-white rounded-tl-none'
                : 'bg-gray-200 text-gray-800 rounded-tr-none'
        }`;

        const textP = document.createElement('p');
        textP.className = 'whitespace-pre-wrap';
        // XSS protection: using textContent
        textP.textContent = text;

        bubbleDiv.appendChild(textP);
        messageDiv.appendChild(bubbleDiv);
        chatContainer.appendChild(messageDiv);

        scrollToBottom();
    }

    function appendError(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-end mb-4';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'p-3 max-w-[80%] rounded-lg bg-red-200 text-red-800 rounded-tr-none border border-red-300';

        const textP = document.createElement('p');
        textP.className = 'whitespace-pre-wrap text-sm';
        textP.textContent = `خطأ: ${text}`;

        bubbleDiv.appendChild(textP);
        messageDiv.appendChild(bubbleDiv);
        chatContainer.appendChild(messageDiv);

        scrollToBottom();
    }

    function showLoading() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-end'
        messageDiv.id = 'loading-indicator';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bg-gray-200 p-3 rounded-lg rounded-tr-none typing-indicator flex items-center justify-center';
        bubbleDiv.innerHTML = '<span></span><span></span><span></span>';

        messageDiv.appendChild(bubbleDiv);
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function removeLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.remove();
        }
    }

    function scrollToBottom() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Disable input while sending
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.disabled = true;
        sendButton.disabled = true;

        // Append user message to UI
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
                const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
                appendError(errorMsg);
                // Remove the last user message from history on error to allow retry
                conversationHistory.pop();
            } else if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                conversationHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                appendError('لم يتم استلام استجابة صالحة.');
            }

        } catch (error) {
            removeLoading();
            appendError(error.message);
            conversationHistory.pop();
        } finally {
            // Re-enable input
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Verify send button is not disabled to prevent duplicate requests
            if (!sendButton.disabled) {
                sendMessage();
            }
        }
    });
});