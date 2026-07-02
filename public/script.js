document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const errorContainer = document.getElementById('error-container');

    let conversationContext = [
        // Optional: you can include a system prompt here if needed
        // { role: 'system', content: 'You are a helpful AI assistant speaking Arabic.' }
    ];

    function appendMessage(role, text) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('flex');

        // In RTL layout (dir="rtl"), justify-start aligns to the right (user), justify-end aligns to the left (assistant)
        if (role === 'user') {
            messageWrapper.classList.add('justify-start');
        } else {
            messageWrapper.classList.add('justify-end');
        }

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('rounded-lg', 'px-4', 'py-2', 'max-w-[80%]', 'whitespace-pre-wrap');
        messageBubble.textContent = text; // XSS protection

        if (role === 'user') {
            messageBubble.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
        } else {
            messageBubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
        }

        messageWrapper.appendChild(messageBubble);
        chatHistory.appendChild(messageWrapper);

        // Auto-scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;

        return messageWrapper; // Return wrapper for potentially modifying it (like removing loading indicator)
    }

    function showError(message) {
        errorContainer.textContent = `خطأ: ${message}`;
        errorContainer.classList.remove('hidden');
    }

    function hideError() {
        errorContainer.classList.add('hidden');
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Reset state
        hideError();
        chatInput.value = '';
        sendBtn.disabled = true;

        // Append user message
        appendMessage('user', text);
        conversationContext.push({ role: 'user', content: text });

        // Show loading indicator
        const loadingIndicator = appendMessage('assistant', 'جاري الكتابة...');
        loadingIndicator.id = 'loading-indicator';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationContext })
            });

            const data = await response.json();

            // Remove loading indicator
            loadingIndicator.remove();

            if (!response.ok) {
                throw new Error(data.error ? data.error.message : 'Unknown server error');
            }

            const aiMessageContent = data.choices[0].message.content;

            // Append AI message
            appendMessage('assistant', aiMessageContent);
            conversationContext.push({ role: 'assistant', content: aiMessageContent });

        } catch (error) {
            // Remove loading indicator if still there
            if (document.getElementById('loading-indicator')) {
                document.getElementById('loading-indicator').remove();
            }
            showError(error.message);
        } finally {
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    sendBtn.addEventListener('click', handleSend);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });
});
