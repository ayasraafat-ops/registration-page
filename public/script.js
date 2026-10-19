document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    function appendMessage(role, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

        const bubbleDiv = document.createElement('div');
        // Apply appropriate Tailwind classes for RTL layout (rounded-tl-none for user, rounded-tr-none for assistant)
        const baseClasses = 'rounded-lg p-3 shadow max-w-3xl whitespace-pre-wrap';
        if (role === 'user') {
            bubbleDiv.className = `bg-blue-100 text-blue-900 rounded-tl-none ${baseClasses}`;
        } else if (role === 'error') {
            bubbleDiv.className = `bg-red-100 text-red-900 rounded-tr-none ${baseClasses}`;
        } else {
            // Assistant
            bubbleDiv.className = `bg-white text-gray-800 rounded-tr-none ${baseClasses}`;
        }

        // Use textContent to prevent XSS
        bubbleDiv.textContent = text;

        messageDiv.appendChild(bubbleDiv);
        chatContainer.appendChild(messageDiv);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Disable input while processing
        userInput.value = '';
        sendButton.disabled = true;
        userInput.disabled = true;

        appendMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });

        // Show loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'flex justify-start';
        loadingDiv.innerHTML = `<div class="bg-gray-200 text-gray-500 rounded-lg rounded-tr-none p-3 shadow max-w-3xl animate-pulse">جاري التفكير...</div>`;
        chatContainer.appendChild(loadingDiv);
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
            document.getElementById(loadingId)?.remove();

            if (!response.ok) {
                const errorMsg = data.error?.message || "حدث خطأ غير معروف.";
                appendMessage('error', `عذراً، حدث خطأ: ${errorMsg}`);
                // Don't save failed user message to history, or maybe pop it, but for simplicity let's keep it or just let the user try again.
            } else {
                const assistantMessage = data.choices[0]?.message?.content || "";
                appendMessage('assistant', assistantMessage);
                conversationHistory.push({ role: 'assistant', content: assistantMessage });
            }

        } catch (error) {
             document.getElementById(loadingId)?.remove();
             appendMessage('error', `خطأ في الاتصال: ${error.message}`);
        } finally {
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            sendMessage();
        }
    });
});