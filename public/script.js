document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Store conversation history
    let messages = [
        { role: 'system', content: 'أنت مساعد ذكاء اصطناعي مفيد. أجب باللغة العربية.' }
    ];

    // Function to append a message to the UI
    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex';

        // RTL Logic:
        // User messages are on the left side ('justify-end' in RTL container pushes to visual left)
        // Assistant messages are on the right side ('justify-start' in RTL container keeps at visual right)

        if (role === 'user') {
            messageDiv.classList.add('justify-end');
        } else {
            messageDiv.classList.add('justify-start');
        }

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'p-3 rounded-lg max-w-[80%] shadow';

        if (role === 'user') {
            bubbleDiv.classList.add('bg-blue-600', 'text-white');
        } else if (role === 'error') {
            bubbleDiv.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-300');
            messageDiv.classList.add('justify-start'); // Error messages show up on the left (visual right in RTL)
        } else {
            // Assistant
            bubbleDiv.classList.add('bg-gray-200', 'text-gray-800');
        }

        const textP = document.createElement('p');
        textP.className = 'message-content';
        textP.textContent = content; // XSS protection: Using textContent instead of innerHTML

        bubbleDiv.appendChild(textP);
        messageDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to handle sending a message
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Disable input and button while processing
        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;

        // Reset textarea height
        userInput.style.height = 'auto';

        // Add user message to UI and history
        appendMessage('user', text);
        messages.push({ role: 'user', content: text });

        // Add a temporary "typing..." indicator
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'flex justify-start';
        typingDiv.innerHTML = `
            <div class="bg-gray-200 text-gray-500 p-3 rounded-lg max-w-[80%] shadow text-sm italic">
                جاري التفكير...
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: messages })
            });

            const data = await response.json();

            // Remove typing indicator
            const typingElement = document.getElementById(typingId);
            if (typingElement) typingElement.remove();

            if (!response.ok) {
                const errorMsg = data.error?.message || 'حدث خطأ غير معروف';
                appendMessage('error', 'خطأ الخادم: ' + errorMsg);
                // Remove the failed message from history so user can try again
                messages.pop();
            } else if (data.choices && data.choices.length > 0) {
                const aiContent = data.choices[0].message.content;
                appendMessage('assistant', aiContent);
                messages.push({ role: 'assistant', content: aiContent });
            } else {
                appendMessage('error', 'استجابة غير صالحة من الخادم');
            }

        } catch (error) {
            // Remove typing indicator
            const typingElement = document.getElementById(typingId);
            if (typingElement) typingElement.remove();

            appendMessage('error', 'فشل في الاتصال بالخادم: ' + error.message);
            messages.pop();
        } finally {
            // Re-enable input and button
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        // Limit max height
        if (this.scrollHeight > 150) {
            this.style.overflowY = 'auto';
            this.style.height = '150px';
        } else {
            this.style.overflowY = 'hidden';
        }
    });
});
