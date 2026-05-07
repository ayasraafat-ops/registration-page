document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');

    // Message history array
    let messagesHistory = [];

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // Add a message to the UI securely using textContent for XSS protection
    const addMessageToUI = (text, isUser) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;

        const bubbleDiv = document.createElement('div');
        // Styling based on memory RTL guidelines
        if (isUser) {
            bubbleDiv.className = 'bg-blue-600 text-white rounded-2xl rounded-tl-none px-5 py-3 shadow-sm max-w-[85%]';
        } else {
            bubbleDiv.className = 'bg-white text-gray-800 rounded-2xl rounded-tr-none px-5 py-3 shadow-sm max-w-[85%] border border-gray-100';
        }

        const textPara = document.createElement('p');
        textPara.className = 'whitespace-pre-wrap text-sm md:text-base leading-relaxed';
        textPara.textContent = text; // Secures against XSS

        bubbleDiv.appendChild(textPara);
        messageDiv.appendChild(bubbleDiv);
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    };

    // Add a loading indicator
    const addLoadingIndicator = () => {
        const id = 'loading-' + Date.now();
        const html = `
            <div id="${id}" class="flex justify-start mb-4">
                <div class="bg-white text-gray-800 rounded-2xl rounded-tr-none px-5 py-3 shadow-sm max-w-[85%] border border-gray-100 flex items-center space-x-2 space-x-reverse">
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', html);
        scrollToBottom();
        return id;
    };

    // Remove the loading indicator
    const removeLoadingIndicator = (id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
    };

    // Set UI loading state
    const setLoading = (isLoading) => {
        messageInput.disabled = isLoading;
        sendButton.disabled = isLoading;
        if (isLoading) {
            sendButton.classList.add('opacity-50', 'cursor-not-allowed');
            sendButton.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            `;
        } else {
            sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
            sendButton.innerHTML = '<span>إرسال</span>';
            messageInput.focus();
        }
    };

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;

        // 1. Update UI with user message
        addMessageToUI(text, true);
        messageInput.value = '';

        // 2. Update history
        messagesHistory.push({ role: 'user', content: text });

        // 3. Set loading state
        setLoading(true);
        const loadingId = addLoadingIndicator();

        try {
            // 4. Call backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messagesHistory })
            });

            const data = await response.json();

            removeLoadingIndicator(loadingId);

            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
            }

            // 5. Update UI with AI response
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const aiResponse = data.choices[0].message.content;
                addMessageToUI(aiResponse, false);
                messagesHistory.push({ role: 'assistant', content: aiResponse });
            } else {
                throw new Error('استجابة غير متوقعة من الخادم');
            }

        } catch (error) {
            removeLoadingIndicator(loadingId);
            addMessageToUI(`عذراً، حدث خطأ: ${error.message}`, false);
        } finally {
            setLoading(false);
        }
    });
});
