document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Conversation history including system prompt
    let messages = [
        { role: 'system', content: 'أنت مساعد ذكاء اصطناعي مفيد يتحدث باللغة العربية.' }
    ];

    function appendMessage(role, text, isError = false) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageBubble = document.createElement('div');

        // Base classes
        let classes = 'px-4 py-2 max-w-[80%] whitespace-pre-wrap rounded-lg ';

        if (role === 'user') {
            classes += 'bg-blue-600 text-white rounded-tl-none';
        } else {
            classes += isError ? 'bg-red-100 text-red-800 rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tr-none';
        }

        messageBubble.className = classes;
        // Use textContent to prevent XSS
        messageBubble.textContent = text;

        messageWrapper.appendChild(messageBubble);
        chatContainer.appendChild(messageWrapper);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function handleSend() {
        if (sendButton.disabled) return;

        const text = userInput.value.trim();
        if (!text) return;

        // Disable input while processing
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        appendMessage('user', text);
        messages.push({ role: 'user', content: text });

        // Add loading indicator
        const loadingWrapper = document.createElement('div');
        loadingWrapper.className = 'flex justify-start';
        loadingWrapper.id = 'loading-indicator';
        const loadingBubble = document.createElement('div');
        loadingBubble.className = 'px-4 py-2 max-w-[80%] whitespace-pre-wrap rounded-lg bg-gray-200 text-gray-800 rounded-tr-none flex items-center space-x-2 space-x-reverse';
        loadingBubble.innerHTML = '<span class="animate-pulse">... يكتب</span>';
        loadingWrapper.appendChild(loadingBubble);
        chatContainer.appendChild(loadingWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages })
            });

            const data = await response.json();

            // Remove loading indicator
            const loadingEl = document.getElementById('loading-indicator');
            if (loadingEl) loadingEl.remove();

            if (!response.ok) {
                // Show specific technical error details
                const errorMsg = data.error || 'حدث خطأ غير معروف';
                appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
                // Don't save failed user message to context if needed, or leave it.
            } else if (data.choices && data.choices.length > 0) {
                const assistantMessage = data.choices[0].message.content;
                appendMessage('assistant', assistantMessage);
                messages.push({ role: 'assistant', content: assistantMessage });
            } else {
                appendMessage('assistant', 'عذراً، استجابة غير متوقعة من الخادم.', true);
            }

        } catch (error) {
            const loadingEl = document.getElementById('loading-indicator');
            if (loadingEl) loadingEl.remove();

            appendMessage('assistant', `عذراً، حدث خطأ في الاتصال: ${error.message}`, true);
        } finally {
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', handleSend);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });
});
