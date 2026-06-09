document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const errorContainer = document.getElementById('error-message');

    // Store conversation history
    let messages = [
        { role: "system", content: "أنت مساعد ذكي ومفيد تتحدث باللغة العربية بطلاقة." }
    ];

    function appendMessage(role, content) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageBubble = document.createElement('div');
        // User messages are blue, assistant messages are white
        messageBubble.className = role === 'user'
            ? 'bg-blue-600 text-white rounded-lg p-3 max-w-[80%] md:max-w-[70%] shadow message-content'
            : 'bg-white text-gray-800 rounded-lg p-3 max-w-[80%] md:max-w-[70%] shadow message-content border border-gray-100';

        // Prevent XSS by using textContent
        messageBubble.textContent = content;

        messageWrapper.appendChild(messageBubble);
        chatContainer.appendChild(messageWrapper);

        // Auto scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000);
    }

    async function sendMessage() {
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        // Disable input while sending
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = 'جاري الإرسال...';
        sendButton.classList.add('opacity-50');

        // Add to UI and history
        appendMessage('user', userMessage);
        messages.push({ role: "user", content: userMessage });

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'حدث خطأ في الاتصال بالخادم.');
            }

            if (data.choices && data.choices.length > 0) {
                const assistantMessage = data.choices[0].message.content;
                appendMessage('assistant', assistantMessage);
                messages.push({ role: "assistant", content: assistantMessage });
            } else {
                throw new Error('لم يتم استلام رد صالح من الخادم.');
            }

        } catch (error) {
            console.error('Error:', error);
            showError(`خطأ: ${error.message}`);
            // Remove the failed user message from history so they can try again
            messages.pop();
        } finally {
            // Re-enable input
            messageInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'إرسال';
            sendButton.classList.remove('opacity-50');
            messageInput.focus();
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initial focus
    messageInput.focus();
});
