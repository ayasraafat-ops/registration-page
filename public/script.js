document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');

    // Store conversation history
    let messagesHistory = [];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        // Clear input and disable button
        messageInput.value = '';
        sendButton.disabled = true;

        // Add user message to UI and history
        appendMessage('user', userMessage);
        messagesHistory.push({ role: 'user', content: userMessage });

        // Show loading indicator
        const loadingId = appendLoading();

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
            removeElement(loadingId);

            if (!response.ok) {
                const errorMessage = data.error ? data.error.message : 'حدث خطأ غير متوقع.';
                appendMessage('system', `خطأ: ${errorMessage}`);
            } else if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                messagesHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                appendMessage('system', 'لم يتم استلام أي رد.');
            }

        } catch (error) {
            removeElement(loadingId);
            appendMessage('system', `خطأ في الاتصال: ${error.message}`);
        } finally {
            sendButton.disabled = false;
            messageInput.focus();
        }
    });

    function appendMessage(role, content) {
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageDiv = document.createElement('div');

        if (role === 'user') {
            messageDiv.className = 'bg-blue-600 text-white shadow-sm rounded-lg rounded-tl-none px-4 py-3 max-w-[80%]';
        } else if (role === 'assistant') {
            messageDiv.className = 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-lg rounded-tr-none px-4 py-3 max-w-[80%]';
        } else {
            // system/error
            messageDiv.className = 'bg-red-100 text-red-800 border border-red-200 shadow-sm rounded-lg px-4 py-3 max-w-[80%]';
        }

        const p = document.createElement('p');
        p.className = 'whitespace-pre-wrap';
        // Secure against XSS
        p.textContent = content;

        messageDiv.appendChild(p);
        wrapper.appendChild(messageDiv);
        chatContainer.appendChild(wrapper);

        scrollToBottom();
    }

    function appendLoading() {
        const id = 'loading-' + Date.now();
        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = 'flex justify-start';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-gray-200 text-gray-600 rounded-lg rounded-tr-none px-4 py-3 flex gap-1 items-center';

        // Animated dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
            dot.style.animationDelay = `${i * 0.15}s`;
            messageDiv.appendChild(dot);
        }

        wrapper.appendChild(messageDiv);
        chatContainer.appendChild(wrapper);
        scrollToBottom();

        return id;
    }

    function removeElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});