document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let chatHistory = [];

    function appendMessage(text, isUser) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex flex-col space-y-2 ${isUser ? 'items-end' : 'items-start'}`;

        const messageBubble = document.createElement('div');
        messageBubble.className = `${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg py-2 px-4 max-w-[80%] shadow-sm whitespace-pre-wrap`;
        messageBubble.textContent = text;

        messageWrapper.appendChild(messageBubble);
        chatContainer.appendChild(messageWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Disable input and button while loading
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;

        appendMessage(text, true);
        chatHistory.push({ role: 'user', content: text });

        // Add a temporary loading message
        const loadingId = 'loading-' + Date.now();
        const loadingWrapper = document.createElement('div');
        loadingWrapper.id = loadingId;
        loadingWrapper.className = `flex flex-col space-y-2 items-start`;
        loadingWrapper.innerHTML = `<div class="bg-gray-200 text-gray-800 rounded-lg py-2 px-4 max-w-[80%] shadow-sm animate-pulse">Thinking...</div>`;
        chatContainer.appendChild(loadingWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: chatHistory })
            });

            // Remove loading message
            document.getElementById(loadingId).remove();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content;
                appendMessage(aiMessage, false);
                chatHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                throw new Error('Invalid response format from API');
            }

        } catch (error) {
            console.error('Error:', error);
            // Remove loading message if it's still there
            const loadingEl = document.getElementById(loadingId);
            if(loadingEl) loadingEl.remove();
            appendMessage('Sorry, there was an error processing your request.', false);
        } finally {
            // Re-enable input
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
