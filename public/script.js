document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const errorBox = document.getElementById('error-box');

    let conversationHistory = [];

    // Helper to safely construct DOM and prevent XSS
    function appendMessage(role, text) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex w-full ' + (role === 'user' ? 'justify-end' : 'justify-start');

        const bubble = document.createElement('div');
        // User messages (RTL left-aligned visual via justify-end), Assistant (RTL right-aligned via justify-start)
        bubble.className = role === 'user'
            ? 'bg-gray-200 text-gray-900 rounded-lg p-3 max-w-[80%] shadow-sm'
            : 'bg-blue-100 text-blue-900 rounded-lg p-3 max-w-[80%] shadow-sm';

        const paragraph = document.createElement('p');
        paragraph.className = 'message-content';
        paragraph.textContent = text; // Safely sets text content to prevent XSS

        bubble.appendChild(paragraph);
        wrapper.appendChild(bubble);
        chatBox.appendChild(wrapper);

        // Auto-scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showError(message) {
        errorBox.textContent = `خطأ: ${message}`;
        errorBox.classList.remove('hidden');
        setTimeout(() => {
            errorBox.classList.add('hidden');
        }, 5000);
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Clear input and disable button temporarily
        userInput.value = '';
        sendButton.disabled = true;
        sendButton.classList.add('opacity-50', 'cursor-not-allowed');

        appendMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });

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
                const errorMessage = data.error || 'حدث خطأ غير معروف.';
                throw new Error(errorMessage);
            }

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const aiMessage = data.choices[0].message.content;
                appendMessage('assistant', aiMessage);
                conversationHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                throw new Error('تنسيق الاستجابة غير صحيح من الخادم.');
            }

        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            // Re-enable button
            sendButton.disabled = false;
            sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line
            sendMessage();
        }
    });
});
