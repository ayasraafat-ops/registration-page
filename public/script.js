document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');

    let chatHistory = [];

    function appendMessage(role, content) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('flex', 'w-full');

        // Align user to left (RTL visually puts left at end of flow, so flex-row-reverse or specific margins)
        // In RTL mode, "left" is logically "end". We'll use Tailwind classes to align.
        if (role === 'user') {
            messageWrapper.classList.add('justify-end'); // Left side in RTL
        } else {
            messageWrapper.classList.add('justify-start'); // Right side in RTL
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('max-w-[75%]', 'p-3', 'rounded-lg', 'message-content', 'shadow-sm');

        if (role === 'user') {
            messageDiv.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
        } else if (role === 'assistant') {
            messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
        } else {
            // Error message styling
            messageDiv.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-400');
        }

        // Set textContent to prevent XSS. white-space: pre-wrap maintains formatting.
        messageDiv.style.whiteSpace = 'pre-wrap';
        messageDiv.textContent = content;

        messageWrapper.appendChild(messageDiv);
        chatContainer.appendChild(messageWrapper);

        // Auto-scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage(message) {
        // Add to local history
        chatHistory.push({ role: 'user', content: message });
        appendMessage('user', message);

        // Disable input while waiting
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingWrapper = document.createElement('div');
        loadingWrapper.id = loadingId;
        loadingWrapper.classList.add('flex', 'w-full', 'justify-start');

        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('bg-gray-200', 'text-gray-500', 'p-3', 'rounded-lg', 'rounded-tr-none', 'animate-pulse');
        loadingDiv.textContent = 'يكتب...';

        loadingWrapper.appendChild(loadingDiv);
        chatContainer.appendChild(loadingWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: chatHistory })
            });

            const data = await response.json();

            // Remove loading indicator
            document.getElementById(loadingId)?.remove();

            if (!response.ok) {
                const errorMsg = data.error?.message || "حدث خطأ غير معروف.";
                appendMessage('error', `عذرًا، حدث خطأ: ${errorMsg}`);
                chatHistory.pop(); // Remove the user message from history on error to allow retry
            } else if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message;
                chatHistory.push(aiMessage);
                appendMessage('assistant', aiMessage.content);
            } else {
                appendMessage('error', "استجابة غير صالحة من الخادم.");
            }
        } catch (error) {
            document.getElementById(loadingId)?.remove();
            appendMessage('error', `فشل الاتصال بالخادم: ${error.message}`);
            chatHistory.pop();
        } finally {
            // Re-enable input
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    });
});
