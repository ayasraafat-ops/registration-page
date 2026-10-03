document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    let chatHistory = [];

    function appendMessage(role, content) {
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageBox = document.createElement('div');

        let baseClasses = 'rounded-lg p-3 max-w-[80%] whitespace-pre-wrap ';
        if (role === 'user') {
            baseClasses += 'bg-blue-600 text-white rounded-tl-none';
        } else if (role === 'error') {
            baseClasses += 'bg-red-100 text-red-700 rounded-tr-none border border-red-300';
        } else {
            baseClasses += 'bg-gray-200 text-gray-800 rounded-tr-none';
        }

        messageBox.className = baseClasses;
        messageBox.textContent = content; // Prevents XSS

        wrapper.appendChild(messageBox);
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return wrapper; // return wrapper in case we need to remove it (like loading indicator)
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Disable input while processing
        chatInput.value = '';
        chatInput.disabled = true;
        sendButton.disabled = true;

        appendMessage('user', message);
        chatHistory.push({ role: "user", content: message });

        const loadingMsg = appendMessage('assistant', 'جاري التفكير...');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });

            const data = await response.json();

            // Remove loading message
            chatContainer.removeChild(loadingMsg);

            if (!response.ok) {
                const errorMsg = data.error?.message || 'حدث خطأ غير معروف';
                appendMessage('error', `عذراً، حدث خطأ: ${errorMsg}`);
            } else {
                const aiResponse = data.choices[0].message.content;
                appendMessage('assistant', aiResponse);
                chatHistory.push({ role: "assistant", content: aiResponse });
            }

        } catch (error) {
            chatContainer.removeChild(loadingMsg);
            appendMessage('error', `خطأ في الاتصال: ${error.message}`);
        } finally {
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            sendMessage();
        }
    });
});
