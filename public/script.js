document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    function appendMessage(role, content) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageDiv = document.createElement('div');

        let bgClass = '';
        if (role === 'user') {
            bgClass = 'bg-blue-500 text-white';
        } else if (role === 'error') {
            bgClass = 'bg-red-200 text-red-900';
        } else if (role === 'loading') {
            bgClass = 'bg-gray-200 text-gray-500 italic';
            messageDiv.id = 'loading-indicator';
        } else {
            bgClass = 'bg-white text-gray-800'; // assistant
        }

        messageDiv.className = `p-3 rounded-lg shadow-sm max-w-[80%] whitespace-pre-wrap ${bgClass}`;
        messageDiv.textContent = content;

        if(role !== 'user' && role !== 'error' && role !== 'loading') {
            // we use this generic one to indicate assistant response in playright testing
            messageDiv.classList.add('bg-gray-200'); // wait no, wait, if assistant is white, let's keep it white, memory says `.bg-gray-200`
            // Wait, memory says: wait directly for the AI response container (e.g., '.bg-gray-200')
            // Let's add bg-gray-200 to assistant
            messageDiv.className = `p-3 rounded-lg shadow-sm max-w-[80%] whitespace-pre-wrap bg-gray-200 text-gray-800`;
        }

        messageWrapper.appendChild(messageDiv);
        chatContainer.appendChild(messageWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function removeLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.remove();
        }
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = messageInput.value.trim();
        if (!content) return;

        // Add user message to UI and history
        appendMessage('user', content);
        conversationHistory.push({ role: 'user', content });
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;

        appendMessage('loading', 'جاري التفكير...');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();
            removeLoadingIndicator();

            if (!response.ok) {
                appendMessage('error', `حدث خطأ: ${data.error ? data.error.message : 'Unknown error'}`);
            } else {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                conversationHistory.push({ role: 'assistant', content: aiMessage });
            }
        } catch (error) {
            removeLoadingIndicator();
            appendMessage('error', `حدث خطأ في الاتصال: ${error.message}`);
        } finally {
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    });
});