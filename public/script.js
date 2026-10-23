document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    let messagesHistory = [];

    function appendMessage(content, role) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageDiv = document.createElement('div');
        messageDiv.className = `p-4 rounded-lg max-w-[80%] md:max-w-[70%] ${
            role === 'user'
                ? 'bg-blue-600 text-white rounded-tl-none'
                : role === 'error'
                    ? 'bg-red-100 text-red-800 rounded-tr-none'
                    : 'bg-gray-200 text-gray-800 rounded-tr-none'
        }`;

        // Prevent XSS
        messageDiv.style.whiteSpace = 'pre-wrap';
        messageDiv.textContent = content;

        messageWrapper.appendChild(messageDiv);
        chatContainer.appendChild(messageWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        messagesHistory.push({ role: 'user', content: text });

        userInput.value = '';
        sendBtn.disabled = true;
        userInput.disabled = true;

        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingWrapper = document.createElement('div');
        loadingWrapper.id = loadingId;
        loadingWrapper.className = 'flex justify-start mb-4';
        loadingWrapper.innerHTML = `
            <div class="bg-gray-100 text-gray-500 p-4 rounded-lg rounded-tr-none">
                <span class="animate-pulse">جاري التفكير...</span>
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
                body: JSON.stringify({ messages: messagesHistory })
            });

            const data = await response.json();

            // Remove loading indicator
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.remove();

            if (!response.ok) {
                const errorMessage = data?.error?.message || 'حدث خطأ في الاتصال بالخادم.';
                appendMessage(`خطأ: ${errorMessage}`, 'error');
                return;
            }

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const assistantContent = data.choices[0].message.content;
                appendMessage(assistantContent, 'assistant');
                messagesHistory.push({ role: 'assistant', content: assistantContent });
            } else {
                appendMessage('لم يتم استلام رد صالح من النموذج.', 'error');
            }

        } catch (error) {
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.remove();

            appendMessage(`خطأ: ${error.message}`, 'error');
        } finally {
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            sendMessage();
        }
    });
});
