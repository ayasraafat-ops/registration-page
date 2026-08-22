document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Conversation history to pass to the API
    let conversation = [
        { role: 'system', content: 'أنت مساعد ذكاء اصطناعي مفيد. يجب أن تكون جميع إجاباتك باللغة العربية.' }
    ];

    // Function to append a message to the chat UI
    function appendMessage(role, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('flex');

        // Right align user (justify-start in RTL), Left align assistant (justify-end in RTL)
        if (role === 'user') {
            messageDiv.classList.add('justify-start');
        } else {
            messageDiv.classList.add('justify-end');
        }

        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('p-3', 'rounded-2xl', 'max-w-[80%]', 'whitespace-pre-wrap');

        if (role === 'user') {
            bubbleDiv.classList.add('bg-blue-600', 'text-white', 'rounded-tr-none');
        } else if (role === 'error') {
            bubbleDiv.classList.add('bg-red-200', 'text-red-800', 'rounded-tl-none');
        } else {
            // assistant
            bubbleDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tl-none');
        }

        // XSS protection: use textContent
        bubbleDiv.textContent = text;

        messageDiv.appendChild(bubbleDiv);
        chatContainer.appendChild(messageDiv);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageDiv; // Return for potentially removing it (like a loading indicator)
    }

    // Handle sending message
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto'; // reset height

        // Show user message
        appendMessage('user', text);
        conversation.push({ role: 'user', content: text });

        // Show loading indicator
        const loadingMessageDiv = appendMessage('assistant', 'جاري التفكير...');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversation })
            });

            // Remove loading indicator
            loadingMessageDiv.remove();

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error && data.error.message ? data.error.message : 'Unknown error';
                throw new Error(errorMsg);
            }

            if (data.choices && data.choices.length > 0) {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                conversation.push({ role: 'assistant', content: aiMessage });
            } else {
                throw new Error("No response choices found.");
            }

        } catch (error) {
            // Remove loading indicator if still there
            if(loadingMessageDiv.parentNode) {
                loadingMessageDiv.remove();
            }
            console.error('Error fetching response:', error);
            appendMessage('error', 'عذراً، حدث خطأ: ' + error.message);
            // Optionally pop the user message from conversation history if API failed?
            // Let's keep it simple and just leave it for context
        }
    }

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if(this.scrollHeight > 150) {
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }
    });

    // Enter to send (shift+enter for new line)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
});
