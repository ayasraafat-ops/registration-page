document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');

    let chatHistory = [];

    function showError(message) {
        errorText.textContent = message;
        errorContainer.classList.remove('hidden');
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000);
    }

    function appendMessage(role, content) {
        const wrapperDiv = document.createElement('div');
        // In RTL, user messages go to the right (justify-start), AI to the left (justify-end)
        wrapperDiv.className = role === 'user' ? 'flex justify-start' : 'flex justify-end';

        const messageDiv = document.createElement('div');
        messageDiv.className = role === 'user'
            ? 'bg-blue-600 text-white p-3 rounded-xl rounded-tr-none shadow-sm max-w-[80%] whitespace-pre-wrap'
            : 'bg-white text-gray-800 p-3 rounded-xl rounded-tl-none shadow-sm max-w-[80%] border border-gray-100 whitespace-pre-wrap';

        // Prevent XSS by using textContent
        messageDiv.textContent = content;

        wrapperDiv.appendChild(messageDiv);
        chatContainer.appendChild(wrapperDiv);

        // Scroll to bottom
        chatContainer.parentElement.parentElement.scrollTop = chatContainer.parentElement.parentElement.scrollHeight;
    }

    function addLoadingIndicator() {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'flex justify-end';
        wrapperDiv.id = 'loading-indicator';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-white text-gray-800 p-3 rounded-xl rounded-tl-none shadow-sm flex space-x-1 space-x-reverse border border-gray-100';

        for(let i=0; i<3; i++) {
            const dot = document.createElement('div');
            dot.className = 'w-2 h-2 bg-gray-400 rounded-full typing-dot';
            messageDiv.appendChild(dot);
        }

        wrapperDiv.appendChild(messageDiv);
        chatContainer.appendChild(wrapperDiv);
        chatContainer.parentElement.parentElement.scrollTop = chatContainer.parentElement.parentElement.scrollHeight;
    }

    function removeLoadingIndicator() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Disable input
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        // Append user message
        appendMessage('user', text);
        chatHistory.push({ role: 'user', content: text });

        addLoadingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: chatHistory })
            });

            const data = await response.json();
            removeLoadingIndicator();

            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم.');
            }

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                chatHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                throw new Error('تنسيق غير متوقع للاستجابة.');
            }
        } catch (error) {
            removeLoadingIndicator();
            showError(`خطأ: ${error.message}`);
            // Remove the failed user message from history so they can try again
            chatHistory.pop();
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
