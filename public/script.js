document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    function appendMessage(role, content) {
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageBubble = document.createElement('div');
        messageBubble.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
            role === 'user'
                ? 'bg-blue-600 text-white rounded-tl-none'
                : 'bg-gray-200 text-gray-800 rounded-tr-none'
        }`;

        // Prevent XSS by using textContent
        messageBubble.textContent = content;

        wrapper.appendChild(messageBubble);
        chatContainer.appendChild(wrapper);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function appendError(message) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex justify-start';

        const messageBubble = document.createElement('div');
        messageBubble.className = 'bg-red-200 text-red-800 p-3 rounded-lg rounded-tr-none max-w-[80%] whitespace-pre-wrap font-semibold';

        messageBubble.textContent = `خطأ: ${message}`;

        wrapper.appendChild(messageBubble);
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Add user message to UI and history
        appendMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });

        // Clear input and disable elements
        messageInput.value = '';
        sendButton.disabled = true;
        messageInput.disabled = true;

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
                throw new Error(data.error && data.error.message ? data.error.message : 'حدث خطأ غير متوقع.');
            }

            if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                conversationHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                throw new Error('لم يتم استلام استجابة صالحة.');
            }

        } catch (error) {
            appendError(error.message);
        } finally {
            // Re-enable elements
            sendButton.disabled = false;
            messageInput.disabled = false;
            messageInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            sendMessage();
        }
    });
});
