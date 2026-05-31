document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');
    const errorToast = document.getElementById('error-toast');

    // Store conversation history
    let conversationHistory = [
        { role: 'system', content: 'You are a helpful AI assistant. Always respond in Arabic unless asked otherwise.' }
    ];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        // Clear input and disable button
        messageInput.value = '';
        sendButton.disabled = true;
        sendButton.innerHTML = '<span class="animate-pulse">...</span>';

        // Add user message to UI and history
        appendMessage(userMessage, 'user');
        conversationHistory.push({ role: 'user', content: userMessage });

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'حدث خطأ في الاتصال بالخادم.');
            }

            if (data.choices && data.choices.length > 0) {
                const assistantMessage = data.choices[0].message.content;
                appendMessage(assistantMessage, 'assistant');
                conversationHistory.push({ role: 'assistant', content: assistantMessage });
            } else {
                throw new Error('لم يتم استلام استجابة صالحة من الذكاء الاصطناعي.');
            }

        } catch (error) {
            showError(error.message);
            console.error('Error:', error);
            // Remove the user message from history if it failed
            conversationHistory.pop();
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = 'إرسال';
            messageInput.focus();
        }
    });

    /**
     * Appends a message to the chat container securely.
     * @param {string} content - The message content.
     * @param {string} role - 'user' or 'assistant'.
     */
    function appendMessage(content, role) {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'flex w-full';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'p-3 rounded-xl shadow max-w-[80%] whitespace-pre-wrap';

        // XSS protection: Use textContent instead of innerHTML
        messageDiv.textContent = content;

        if (role === 'user') {
            // User: align left in RTL (using justify-end)
            wrapperDiv.classList.add('justify-end');
            messageDiv.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tl-none');
        } else {
            // Assistant: align right in RTL (using justify-start)
            wrapperDiv.classList.add('justify-start');
            messageDiv.classList.add('bg-white', 'text-gray-800', 'rounded-tr-none');
        }

        wrapperDiv.appendChild(messageDiv);
        chatContainer.appendChild(wrapperDiv);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * Shows an error message in a toast notification.
     * @param {string} msg
     */
    function showError(msg) {
        errorToast.textContent = msg;
        errorToast.classList.remove('hidden');
        setTimeout(() => {
            errorToast.classList.add('hidden');
        }, 5000);
    }
});