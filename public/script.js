document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    function appendMessage(role, content) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('flex');

        // Right align user (RTL layout means user is usually right, AI left)
        if (role === 'user') {
            messageWrapper.classList.add('justify-start'); // In RTL, start is right
        } else {
            messageWrapper.classList.add('justify-end'); // In RTL, end is left
        }

        const messageBox = document.createElement('div');
        messageBox.classList.add('p-3', 'rounded-lg', 'max-w-[80%]', 'whitespace-pre-wrap');

        if (role === 'user') {
            messageBox.classList.add('bg-blue-600', 'text-white');
        } else if (role === 'assistant') {
            messageBox.classList.add('bg-gray-200', 'text-gray-800');
        } else if (role === 'error') {
            messageBox.classList.add('bg-red-500', 'text-white');
            messageWrapper.classList.add('justify-center');
        }

        // Prevent XSS
        messageBox.textContent = content;

        messageWrapper.appendChild(messageBox);
        chatContainer.appendChild(messageWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageWrapper; // Return so we can remove loading later
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to UI and history
        appendMessage('user', message);
        conversationHistory.push({ role: 'user', content: message });
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        // Show loading indicator
        const loadingIndicator = appendMessage('assistant', 'جاري الكتابة...');
        loadingIndicator.id = 'loading-indicator';

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
            loadingIndicator.remove();

            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ غير متوقع');
            }

            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });

        } catch (error) {
            // Remove loading indicator if not already removed
            const indicator = document.getElementById('loading-indicator');
            if (indicator) indicator.remove();

            console.error('Error:', error);
            appendMessage('error', `حدث خطأ: ${error.message}`);
        } finally {
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
