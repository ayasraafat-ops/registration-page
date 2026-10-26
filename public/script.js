document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    let conversationHistory = [];

    function appendMessage(text, sender) {
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'p-3 rounded-lg max-w-[80%] whitespace-pre-wrap';

        if (sender === 'user') {
            messageDiv.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
        } else if (sender === 'error') {
            messageDiv.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-300');
        } else { // AI
            messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
        }

        messageDiv.textContent = text;
        wrapper.appendChild(messageDiv);
        chatBox.appendChild(wrapper);

        chatBox.scrollTop = chatBox.scrollHeight;

        return wrapper; // Return to remove loading indicator if needed
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // UI Updates
        userInput.value = '';
        sendBtn.disabled = true;
        appendMessage(text, 'user');

        conversationHistory.push({ role: 'user', content: text });

        const loadingIndicator = appendMessage('جاري التفكير...', 'ai');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            chatBox.removeChild(loadingIndicator);

            if (!response.ok) {
                const errorMsg = data.error?.message || 'حدث خطأ غير معروف';
                appendMessage(`عذراً، حدث خطأ: ${errorMsg}`, 'error');
                // Remove the last user message from history so they can retry without polluting context
                conversationHistory.pop();
            } else {
                const aiMessage = data.choices[0].message.content;
                appendMessage(aiMessage, 'ai');
                conversationHistory.push({ role: 'assistant', content: aiMessage });
            }
        } catch (error) {
            chatBox.removeChild(loadingIndicator);
            appendMessage(`عذراً، حدث خطأ في الاتصال: ${error.message}`, 'error');
            conversationHistory.pop();
        } finally {
            sendBtn.disabled = false;
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
