document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.getElementById('chat-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    function appendMessage(role, content, isError = false) {
        const wrapperDiv = document.createElement('div');

        // RTL logic: user on right, assistant on left
        // Flex utilities in RTL: justify-start = right, justify-end = left
        wrapperDiv.className = `flex w-full my-4 ${role === 'user' ? 'justify-start' : 'justify-end'}`;

        const messageDiv = document.createElement('div');
        messageDiv.className = `max-w-[75%] p-4 rounded-lg shadow-sm whitespace-pre-wrap `;

        if (role === 'user') {
            messageDiv.className += 'bg-blue-600 text-white rounded-tr-none';
        } else if (isError) {
            messageDiv.className += 'bg-red-200 text-red-900 border border-red-300 rounded-tl-none';
        } else {
            messageDiv.className += 'bg-white text-gray-800 border border-gray-200 rounded-tl-none';
        }

        // XSS Protection: Use textContent instead of innerHTML
        messageDiv.textContent = content;

        wrapperDiv.appendChild(messageDiv);

        // Insert before the loading indicator if it's there
        if (loadingIndicator && loadingIndicator.parentNode === chatContainer) {
            chatContainer.insertBefore(wrapperDiv, loadingIndicator);
        } else {
            chatContainer.appendChild(wrapperDiv);
        }

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        // 1. Show user message
        appendMessage('user', userMessage);
        conversationHistory.push({ role: 'user', content: userMessage });

        // 2. Clear input & show loading
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;

        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
            chatContainer.appendChild(loadingIndicator); // Move to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        try {
            // 3. Send request to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            // 4. Handle response
            if (!response.ok) {
                const errorMessage = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
                throw new Error(errorMessage);
            }

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                conversationHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                throw new Error('لم يتم استلام استجابة صالحة من الذكاء الاصطناعي');
            }

        } catch (error) {
            console.error("Chat error:", error);
            appendMessage('assistant', `عذرًا، حدث خطأ: ${error.message}`, true);
        } finally {
            // 5. Reset UI state
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    });
});
