document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorBubble = document.getElementById('error-bubble');
    const errorText = document.getElementById('error-text');

    let conversationHistory = [];

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if(this.value === '') {
            this.style.height = '44px';
        }
    });

    // Handle Enter key (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendButton.disabled && messageInput.value.trim() !== '') {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    function appendMessage(role, content) {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('flex', 'w-full', 'mb-4');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('p-3', 'rounded-2xl', 'max-w-[85%]', 'md:max-w-[75%]', 'shadow-sm', 'message-content');
        messageDiv.textContent = content; // Using textContent prevents XSS

        if (role === 'user') {
            wrapperDiv.classList.add('justify-end'); // Align left in RTL (using justify-end)
            messageDiv.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
        } else if (role === 'assistant') {
            wrapperDiv.classList.add('justify-start'); // Align right in RTL (using justify-start)
            messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
        }

        wrapperDiv.appendChild(messageDiv);
        chatContainer.appendChild(wrapperDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showError(message) {
        errorText.textContent = message;
        errorBubble.classList.remove('hidden');
        errorBubble.classList.add('flex');

        // Hide after 5 seconds
        setTimeout(() => {
            errorBubble.classList.add('hidden');
            errorBubble.classList.remove('flex');
        }, 5000);
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        // Add user message to UI and history
        appendMessage('user', userMessage);
        conversationHistory.push({ role: "user", content: userMessage });

        // Reset input
        messageInput.value = '';
        messageInput.style.height = '44px';
        messageInput.focus();

        // UI state loading
        sendButton.disabled = true;
        loadingIndicator.classList.remove('hidden');
        errorBubble.classList.add('hidden');
        errorBubble.classList.remove('flex');

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
                // If the error object exists and has a message, use it. Otherwise use a generic fallback.
                const errorMsg = data.error && data.error.message ? data.error.message : `HTTP error! status: ${response.status}`;
                throw new Error(errorMsg);
            }

            const assistantMessage = data.choices[0].message.content;

            // Add assistant response to UI and history
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: "assistant", content: assistantMessage });

        } catch (error) {
            console.error('Chat error:', error);
            showError(error.message || "حدث خطأ أثناء الاتصال بالخادم.");
            // Remove the last user message from history if the request failed
            conversationHistory.pop();
        } finally {
            sendButton.disabled = false;
            loadingIndicator.classList.add('hidden');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });
});
