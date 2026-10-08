document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let chatHistory = [];

    function appendMessage(role, content) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageBubble = document.createElement('div');

        let bubbleClasses = 'rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-lg shadow ';

        if (role === 'user') {
            bubbleClasses += 'bg-blue-600 text-white rounded-tl-none';
        } else if (role === 'error') {
            bubbleClasses += 'bg-red-100 text-red-800 rounded-tr-none border border-red-300';
        } else {
            bubbleClasses += 'bg-gray-200 text-gray-800 rounded-tr-none';
        }

        messageBubble.className = bubbleClasses;

        // Use textContent with pre-wrap for XSS protection and maintaining line breaks
        messageBubble.style.whiteSpace = 'pre-wrap';
        messageBubble.textContent = content;

        messageWrapper.appendChild(messageBubble);
        chatContainer.appendChild(messageWrapper);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Disable input while processing
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = 'جاري الإرسال...';

        appendMessage('user', text);
        chatHistory.push({ role: 'user', content: text });

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: chatHistory })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف');
            }

            if (data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content;
                appendMessage('assistant', aiResponse);
                chatHistory.push({ role: 'assistant', content: aiResponse });
            } else {
                 throw new Error('استجابة فارغة من الخادم');
            }

        } catch (error) {
            appendMessage('error', `عذراً، حدث خطأ: ${error.message}`);
            // Remove the user message from history if sending failed so they can retry
            chatHistory.pop();
        } finally {
            // Re-enable input
            userInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'إرسال';
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            sendMessage();
        }
    });
});