document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    function appendMessage(role, content, isError = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const bubble = document.createElement('div');

        // Base classes
        let classes = 'p-3 rounded-lg shadow max-w-[80%] whitespace-pre-wrap ';

        if (role === 'user') {
            classes += 'bg-blue-500 text-white rounded-tl-none';
        } else {
            if (isError) {
                classes += 'bg-red-100 text-red-700 border border-red-200 rounded-tr-none';
            } else {
                classes += 'bg-gray-200 text-gray-800 rounded-tr-none'; // Ensure visibility
            }
        }

        bubble.className = classes;

        // Prevent XSS
        bubble.textContent = content;

        wrapper.appendChild(bubble);
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addLoadingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.id = 'loading-indicator';
        wrapper.className = 'flex justify-start';

        const bubble = document.createElement('div');
        bubble.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none shadow max-w-[80%] italic';
        bubble.textContent = 'جاري التفكير...';

        wrapper.appendChild(bubble);
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function removeLoadingIndicator() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Disable input during request
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;

        appendMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });

        addLoadingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();
            removeLoadingIndicator();

            if (!response.ok) {
                const errorMsg = data.error?.message || 'حدث خطأ غير معروف';
                appendMessage('assistant', `خطأ: ${errorMsg}`, true);
            } else {
                const replyText = data.choices?.[0]?.message?.content || 'لا يوجد رد';
                appendMessage('assistant', replyText);
                conversationHistory.push({ role: 'assistant', content: replyText });
            }

        } catch (error) {
            removeLoadingIndicator();
            appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
        } finally {
            messageInput.disabled = false;
            sendButton.disabled = false;
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