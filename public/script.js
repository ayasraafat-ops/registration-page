document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    let messagesHistory = [];

    function appendMessage(role, content) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex w-full ' + (role === 'user' ? 'justify-start' : 'justify-end');

        const messageDiv = document.createElement('div');

        let baseClasses = 'p-3 rounded-xl max-w-[80%] whitespace-pre-wrap shadow-sm text-sm sm:text-base ';
        if (role === 'user') {
            baseClasses += 'bg-blue-600 text-white rounded-tr-none';
        } else if (role === 'error') {
             baseClasses += 'bg-red-100 text-red-800 border border-red-300 rounded-tl-none';
        } else {
            baseClasses += 'bg-gray-200 text-gray-800 rounded-tl-none';
        }

        messageDiv.className = baseClasses;
        messageDiv.textContent = content; // Prevents XSS

        wrapper.appendChild(messageDiv);
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Display user message
        appendMessage('user', text);
        userInput.value = '';

        messagesHistory.push({ role: 'user', content: text });

        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingWrapper = document.createElement('div');
        loadingWrapper.id = loadingId;
        loadingWrapper.className = 'flex w-full justify-end';
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'p-3 rounded-xl bg-gray-200 text-gray-500 rounded-tl-none text-sm';
        loadingDiv.textContent = 'جاري الكتابة...';
        loadingWrapper.appendChild(loadingDiv);
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
            document.getElementById(loadingId)?.remove();

            if (!response.ok) {
                const errorMessage = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
                appendMessage('error', `خطأ: ${errorMessage}`);
                return;
            }

            if (data.choices && data.choices.length > 0) {
                const assistantMessage = data.choices[0].message.content;
                appendMessage('assistant', assistantMessage);
                messagesHistory.push({ role: 'assistant', content: assistantMessage });
            } else {
                appendMessage('error', 'لم يتم استلام رد من النموذج.');
            }

        } catch (error) {
             // Remove loading indicator
             document.getElementById(loadingId)?.remove();
             appendMessage('error', `تعذر الاتصال بالخادم: ${error.message}`);
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
