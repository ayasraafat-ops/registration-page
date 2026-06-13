document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');

    // Conversation history to send to the backend
    let conversationHistory = [];

    // Scroll to the bottom of the chat box
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    /**
     * Appends a message to the chat DOM.
     * Uses textContent to prevent XSS.
     * @param {string} role - 'user', 'assistant', or 'error'
     * @param {string} content - The message text
     */
    function appendMessage(role, content) {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('flex');

        // Align user to left, bot/error to right in RTL
        if (role === 'user') {
            wrapperDiv.classList.add('justify-end');
        } else {
            wrapperDiv.classList.add('justify-start');
        }

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('max-w-xs', 'md:max-w-md', 'lg:max-w-lg', 'px-4', 'py-2', 'rounded-2xl', 'shadow-sm');

        // Use CSS class based on role
        if (role === 'user') {
            msgDiv.classList.add('msg-user');
        } else if (role === 'error') {
            msgDiv.classList.add('msg-error');
        } else {
            msgDiv.classList.add('msg-bot');
        }

        const pTag = document.createElement('p');
        pTag.style.whiteSpace = 'pre-wrap'; // Preserve formatting
        pTag.textContent = content; // XSS protection

        msgDiv.appendChild(pTag);
        wrapperDiv.appendChild(msgDiv);
        chatBox.appendChild(wrapperDiv);

        scrollToBottom();
    }

    /**
     * Set UI state for loading
     */
    function setLoading(isLoading) {
        if (isLoading) {
            messageInput.disabled = true;
            sendBtn.disabled = true;
            sendBtn.textContent = 'جاري...';
        } else {
            messageInput.disabled = false;
            sendBtn.disabled = false;
            sendBtn.textContent = 'إرسال';
            messageInput.focus();
        }
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userText = messageInput.value.trim();
        if (!userText) return;

        // Display user message
        appendMessage('user', userText);
        messageInput.value = '';

        // Add to conversation history
        conversationHistory.push({ role: 'user', content: userText });

        setLoading(true);

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
                // Backend returned an error object
                throw new Error(data.error?.message || 'حدث خطأ غير معروف.');
            }

            // Extract bot message
            const botMessageContent = data.choices[0].message.content;

            // Display bot message
            appendMessage('assistant', botMessageContent);

            // Append bot message to history
            conversationHistory.push({ role: 'assistant', content: botMessageContent });

        } catch (error) {
            console.error("Chat Error:", error);
            // Display explicit technical error in UI as per requirements
            appendMessage('error', `عذراً، حدث خطأ: ${error.message}`);
        } finally {
            setLoading(false);
        }
    });
});
