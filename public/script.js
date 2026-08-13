document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const messagesList = document.getElementById('messages-list');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [
        { role: 'system', content: 'أنت مساعد ذكاء اصطناعي مفيد يتحدث باللغة العربية.' }
    ];

    function appendMessage(role, content, isError = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

        const messageBox = document.createElement('div');
        messageBox.className = `max-w-[80%] rounded-lg p-4 shadow ${
            role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' :
            isError ? 'bg-red-200 text-red-900 rounded-tl-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'
        }`;

        messageBox.style.whiteSpace = 'pre-wrap';
        messageBox.textContent = content;

        wrapper.appendChild(messageBox);
        messagesList.appendChild(wrapper);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        // Add user message to UI and history
        appendMessage('user', userMessage);
        conversationHistory.push({ role: 'user', content: userMessage });

        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;

        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingWrapper = document.createElement('div');
        loadingWrapper.id = loadingId;
        loadingWrapper.className = 'flex w-full justify-end';
        const loadingBox = document.createElement('div');
        loadingBox.className = 'max-w-[80%] rounded-lg p-4 shadow bg-gray-200 text-gray-500 rounded-tl-none italic';
        loadingBox.textContent = 'جاري التفكير...';
        loadingWrapper.appendChild(loadingBox);
        messagesList.appendChild(loadingWrapper);
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
            document.getElementById(loadingId).remove();

            if (!response.ok) {
                throw new Error(data.error ? data.error.message : 'حدث خطأ غير معروف.');
            }

            const aiMessage = data.choices[0].message.content;

            // Add AI message to UI and history
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });

        } catch (error) {
            // Remove loading indicator if still there
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();

            appendMessage('assistant', `خطأ: ${error.message}`, true);
        } finally {
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    });
});
