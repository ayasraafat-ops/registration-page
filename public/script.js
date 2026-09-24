document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    // Helper to auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto'; // Reset if empty
        }
    });

    const appendMessage = (content, sender, isError = false) => {
        const wrapper = document.createElement('div');
        wrapper.className = `flex mb-4 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

        const bubble = document.createElement('div');

        let baseClasses = 'p-3 max-w-[85%] md:max-w-[75%] shadow rounded-lg whitespace-pre-wrap ';
        if (sender === 'user') {
            // User message bubble (RTL: tail on the left)
            bubble.className = baseClasses + 'bg-blue-600 text-white rounded-tl-none';
        } else {
            // Assistant message bubble (RTL: tail on the right)
            if (isError) {
                bubble.className = baseClasses + 'bg-red-100 text-red-800 border border-red-300 rounded-tr-none';
            } else {
                bubble.className = baseClasses + 'bg-gray-200 text-gray-800 rounded-tr-none';
            }
        }

        // Prevent XSS
        bubble.textContent = content;

        wrapper.appendChild(bubble);
        chatContainer.appendChild(wrapper);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return wrapper;
    };

    const sendMessage = async () => {
        const text = messageInput.value.trim();
        if (!text) return;

        // Disable input while processing
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.disabled = true;
        sendButton.disabled = true;

        appendMessage(text, 'user');

        // Add to history
        conversationHistory.push({ role: 'user', content: text });

        // Show loading indicator
        const loadingWrapper = document.createElement('div');
        loadingWrapper.className = 'flex justify-start mb-4';
        loadingWrapper.id = 'loading-indicator';
        loadingWrapper.innerHTML = `
            <div class="bg-gray-200 text-gray-500 rounded-lg p-3 max-w-[85%] md:max-w-[75%] shadow rounded-tr-none flex space-x-2 space-x-reverse items-center">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
        `;
        chatContainer.appendChild(loadingWrapper);
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
            const loader = document.getElementById('loading-indicator');
            if (loader) loader.remove();

            if (!response.ok) {
                const errorMsg = data.error?.message || "حدث خطأ غير معروف.";
                appendMessage(`خطأ: ${errorMsg}`, 'assistant', true);

                // If it's a 401 error (like invalid API key), we don't push the error to history,
                // but we might want to let the user know. Since the user gave a mock key, this will happen.
            } else {
                const aiMessage = data.choices[0]?.message?.content || "";
                if (aiMessage) {
                    appendMessage(aiMessage, 'assistant');
                    conversationHistory.push({ role: 'assistant', content: aiMessage });
                }
            }

        } catch (error) {
            // Remove loading indicator
            const loader = document.getElementById('loading-indicator');
            if (loader) loader.remove();

            appendMessage(`حدث خطأ في الاتصال: ${error.message}`, 'assistant', true);
        } finally {
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    };

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line
            if (!sendButton.disabled) {
                sendMessage();
            }
        }
    });
});
