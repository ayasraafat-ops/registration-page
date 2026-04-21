document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');

    let chatHistory = [];

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = '56px'; // Reset to default h-14 equivalent
        this.style.height = (this.scrollHeight < 120 ? this.scrollHeight : 120) + 'px';
    });

    // Handle Enter key to submit (Shift+Enter for new line)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim() !== '') {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const message = userInput.value.trim();
        if (!message) return;

        // Disable input and button while processing
        userInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="animate-pulse">جاري...</span>';

        // Add user message to UI
        addMessageToUI('user', message);

        // Prepare history for API (excluding the current message which the backend handles)
        const historyToSend = chatHistory.slice(-10);

        // Add current message to history AFTER preparing payload
        chatHistory.push({ role: 'user', content: message });

        // Clear input
        userInput.value = '';
        userInput.style.height = '56px';

        try {
            // Call API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: historyToSend
                })
            });

            if (!response.ok) {
                throw new Error('فشل في الاتصال بالخادم.');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const aiReply = data.reply;

            // Add AI message to UI
            addMessageToUI('assistant', aiReply);

            // Add to history
            chatHistory.push({ role: 'assistant', content: aiReply });

        } catch (error) {
            console.error('Error:', error);
            addMessageToUI('error', 'عذراً، حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى.');
        } finally {
            // Re-enable input and button
            userInput.disabled = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span>إرسال</span>';
            userInput.focus();

            // Scroll to bottom
            scrollToBottom();
        }
    });

    function addMessageToUI(sender, text) {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = sender === 'user' ? 'flex justify-end' : 'flex justify-start';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'px-4 py-3 max-w-[80%] whitespace-pre-wrap rounded-2xl';

        // Crucial: Use textContent to prevent XSS
        messageDiv.textContent = text;

        if (sender === 'user') {
            messageDiv.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
        } else if (sender === 'error') {
            messageDiv.classList.add('bg-red-100', 'text-red-700', 'rounded-tr-none');
        } else {
            messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
        }

        wrapperDiv.appendChild(messageDiv);
        chatBox.appendChild(wrapperDiv);

        scrollToBottom();
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
