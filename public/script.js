document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatContainer = document.getElementById('chat-container');

    // Store conversation history for context
    let conversationHistory = [];

    // Focus input on load
    messageInput.focus();

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const message = messageInput.value.trim();
        if (!message || sendButton.disabled) return;

        // Prevent duplicate submissions
        sendButton.disabled = true;
        messageInput.disabled = true;

        // Add user message to UI
        appendMessage('user', message);
        messageInput.value = '';

        // Add to history
        conversationHistory.push({ role: 'user', content: message });

        // Add loading indicator
        const loadingId = addLoadingIndicator();

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
            removeElement(loadingId);

            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ غير معروف.');
            }

            const aiMessage = data.choices[0].message.content;

            // Add AI message to UI
            appendMessage('assistant', aiMessage);

            // Add to history
            conversationHistory.push({ role: 'assistant', content: aiMessage });

        } catch (error) {
            removeElement(loadingId);
            appendError(error.message);
        } finally {
            sendButton.disabled = false;
            messageInput.disabled = false;
            messageInput.focus();
        }
    });

    // Handle Enter key for submission (though form submit handles this usually)
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    function appendMessage(role, text) {
        const wrapper = document.createElement('div');
        wrapper.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

        const bubble = document.createElement('div');
        // Prevent XSS
        bubble.textContent = text;
        bubble.style.whiteSpace = 'pre-wrap';

        if (role === 'user') {
            bubble.className = 'bg-blue-600 text-white p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm';
        } else {
            bubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm';
        }

        wrapper.appendChild(bubble);
        chatContainer.appendChild(wrapper);
        scrollToBottom();
    }

    function appendError(errorMsg) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex justify-center my-2';

        const errorBubble = document.createElement('div');
        errorBubble.textContent = `خطأ: ${errorMsg}`;
        errorBubble.className = 'bg-red-100 text-red-600 p-2 rounded-lg text-sm shadow-sm max-w-[90%] text-center border border-red-200';

        wrapper.appendChild(errorBubble);
        chatContainer.appendChild(wrapper);
        scrollToBottom();
    }

    function addLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = 'flex justify-start';

        const bubble = document.createElement('div');
        bubble.className = 'bg-gray-200 text-gray-500 p-3 rounded-2xl rounded-tr-none shadow-sm flex gap-1 items-center';

        // Simple typing animation dots
        bubble.innerHTML = `
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></span>
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
        `;

        wrapper.appendChild(bubble);
        chatContainer.appendChild(wrapper);
        scrollToBottom();
        return id;
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});