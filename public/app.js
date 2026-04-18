document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const messagesContainer = document.getElementById('messages');
    const sendText = document.getElementById('send-text');
    const loadingSpinner = document.getElementById('loading-spinner');

    let chatHistory = [];

    const addMessage = (content, isUser) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `max-w-xs md:max-w-md p-3 rounded-lg ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`;
        bubbleDiv.textContent = content;

        messageDiv.appendChild(bubbleDiv);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    const toggleLoading = (isLoading) => {
        if (isLoading) {
            sendText.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            messageInput.disabled = true;
        } else {
            sendText.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
            messageInput.disabled = false;
            messageInput.focus();
        }
    };

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const message = messageInput.value.trim();
        if (!message) return;

        // Display user message
        addMessage(message, true);
        messageInput.value = '';

        toggleLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            // Display AI response
            addMessage(data.reply, false);

            // Update history
            chatHistory.push({ role: 'user', content: message });
            chatHistory.push({ role: 'assistant', content: data.reply });

        } catch (error) {
            console.error('Error:', error);
            addMessage(`Error: ${error.message}`, false);
        } finally {
            toggleLoading(false);
        }
    });
});
