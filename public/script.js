document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const errorContainer = document.getElementById('error-container');

    let conversationHistory = [];

    // Helper to safely append messages (prevents XSS)
    function appendMessage(role, text) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('flex');

        // Assistant aligns left (RTL -> start), User aligns right (RTL -> end)
        if (role === 'assistant') {
            wrapper.classList.add('justify-start');
        } else {
            wrapper.classList.add('justify-end');
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('p-3', 'rounded-lg', 'max-w-3xl');
        messageDiv.style.whiteSpace = 'pre-wrap';

        if (role === 'assistant') {
            messageDiv.classList.add('bg-gray-200', 'text-gray-800');
        } else {
            messageDiv.classList.add('bg-blue-600', 'text-white');
        }

        messageDiv.textContent = text;
        wrapper.appendChild(messageDiv);
        chatContainer.appendChild(wrapper);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    function hideError() {
        errorContainer.classList.add('hidden');
        errorContainer.textContent = '';
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        hideError();
        appendMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });
        userInput.value = '';

        // Add a temporary loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingWrapper = document.createElement('div');
        loadingWrapper.id = loadingId;
        loadingWrapper.classList.add('flex', 'justify-start');
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('bg-gray-200', 'text-gray-500', 'p-3', 'rounded-lg', 'text-sm');
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
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            // Remove loading indicator
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.remove();

            if (!response.ok) {
                const errorMsg = data.error?.message || "حدث خطأ غير معروف";
                showError(`خطأ من الخادم: ${errorMsg}`);
                return;
            }

            const aiMessage = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

            if (aiMessage) {
                appendMessage('assistant', aiMessage);
                conversationHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                showError("لم يتم استلام رد صحيح من الخادم.");
            }

        } catch (error) {
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.remove();
            showError(`خطأ في الاتصال: ${error.message}`);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
