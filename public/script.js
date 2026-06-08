document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const errorContainer = document.getElementById('error-container');

    let conversationHistory = [];

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if(this.value === '') {
            this.style.height = 'auto'; // reset when empty
        }
    });

    // Handle Enter key (Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    function appendMessage(role, content) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageDiv = document.createElement('div');

        if (role === 'user') {
            messageDiv.className = 'bg-blue-600 text-white rounded-lg py-3 px-4 max-w-[80%] rounded-tl-none shadow-sm';
        } else {
            messageDiv.className = 'bg-gray-100 text-gray-800 rounded-lg py-3 px-4 max-w-[80%] rounded-tr-none shadow-sm';
        }

        const textP = document.createElement('p');
        textP.className = 'message-content';
        // Using textContent prevents XSS
        textP.textContent = content;

        messageDiv.appendChild(textP);
        messageWrapper.appendChild(messageDiv);
        chatBox.appendChild(messageWrapper);

        // Scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000);
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto';

        // Hide previous errors
        errorContainer.classList.add('hidden');

        // Add user message to UI and history
        appendMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });

        // Disable input while loading
        userInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.textContent = 'جاري الإرسال...';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'حدث خطأ غير معروف.');
            }

            if (data.choices && data.choices.length > 0) {
                const assistantMessage = data.choices[0].message.content;
                appendMessage('assistant', assistantMessage);
                conversationHistory.push({ role: 'assistant', content: assistantMessage });
            } else {
                throw new Error('لم يتم استلام استجابة صحيحة من الخادم.');
            }

        } catch (error) {
            console.error('Error:', error);
            showError(`خطأ: ${error.message}`);
            // Remove the last user message from history if it failed
            conversationHistory.pop();
        } finally {
            // Re-enable input
            userInput.disabled = false;
            sendBtn.disabled = false;
            sendBtn.textContent = 'إرسال';
            userInput.focus();
        }
    }
});
