document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const sendButton = document.getElementById('send-button');

    // Store conversation history
    let messages = [
        { role: 'system', content: 'أنت مساعد ذكي ومفيد. أجب باللغة العربية.' }
    ];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userText = userInput.value.trim();
        if (!userText) return;

        // Display user message
        appendMessage('user', userText);

        // Add to history
        messages.push({ role: 'user', content: userText });

        // Clear input and disable button
        userInput.value = '';
        sendButton.disabled = true;

        // Show loading indicator
        const loadingId = appendLoading();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages })
            });

            const data = await response.json();

            // Remove loading indicator
            removeMessage(loadingId);

            if (response.ok && data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                messages.push({ role: 'assistant', content: aiMessage });
            } else {
                const errorMsg = data.error ? data.error.message : 'حدث خطأ غير معروف.';
                appendMessage('error', `خطأ: ${errorMsg}`);
                messages.pop(); // Remove the user message from history on error
            }
        } catch (error) {
            removeMessage(loadingId);
            appendMessage('error', `خطأ في الاتصال: ${error.message}`);
            messages.pop(); // Remove the user message from history on error
        } finally {
            sendButton.disabled = false;
            userInput.focus();
        }
    });

    /**
     * Appends a message to the chat box securely.
     * @param {string} role - 'user', 'assistant', or 'error'
     * @param {string} text - The message text
     */
    function appendMessage(role, text) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'flex w-full';

        const messageBubble = document.createElement('div');
        messageBubble.className = 'max-w-[80%] p-3 rounded-lg text-sm sm:text-base whitespace-pre-wrap';

        // XSS Protection: Use textContent instead of innerHTML
        messageBubble.textContent = text;

        if (role === 'user') {
            // User: right-aligned (in RTL, justify-start is left visually if not careful, but flex in RTL:
            // justify-start aligns to the right side of the container)
            messageContainer.classList.add('justify-start');
            messageBubble.classList.add('bg-blue-600', 'text-white', 'rounded-tr-none');
        } else if (role === 'assistant') {
            // AI: left-aligned
            messageContainer.classList.add('justify-end');
            messageBubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tl-none');
        } else if (role === 'error') {
            // Error: center or left
            messageContainer.classList.add('justify-center');
            messageBubble.classList.add('bg-red-200', 'text-red-800');
        }

        messageContainer.appendChild(messageBubble);
        chatBox.appendChild(messageContainer);
        scrollToBottom();
    }

    /**
     * Appends a temporary loading indicator.
     * @returns {string} ID of the loading container
     */
    function appendLoading() {
        const id = 'loading-' + Date.now();
        const messageContainer = document.createElement('div');
        messageContainer.id = id;
        messageContainer.className = 'flex w-full justify-end'; // Align like assistant

        const messageBubble = document.createElement('div');
        messageBubble.className = 'max-w-[80%] p-3 rounded-lg bg-gray-200 text-gray-500 rounded-tl-none text-sm animate-pulse';
        messageBubble.textContent = 'يفكر...';

        messageContainer.appendChild(messageBubble);
        chatBox.appendChild(messageContainer);
        scrollToBottom();

        return id;
    }

    /**
     * Removes a specific message element by ID.
     * @param {string} id
     */
    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
        }
    }

    /**
     * Scrolls the chat box to the bottom.
     */
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
