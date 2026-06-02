document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Conversation history to send to backend
    let conversationHistory = [];

    // Function to append a message to the chat container securely
    function appendMessage(role, content, isError = false) {
        // Create wrapper for flex alignment (RTL layout: user left (end), assistant right (start))
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        // Create message bubble
        const messageDiv = document.createElement('div');
        // Base classes
        let baseClasses = 'p-4 rounded-lg shadow-sm max-w-[80%] lg:max-w-[60%] message-content border';

        if (role === 'user') {
            messageDiv.className = `${baseClasses} bg-blue-100 border-blue-200 text-blue-900`;
        } else {
            if (isError) {
                messageDiv.className = `${baseClasses} bg-red-100 border-red-200 text-red-900`;
            } else {
                messageDiv.className = `${baseClasses} bg-white border-gray-200 text-gray-800`;
            }
        }

        // Strictly set textContent to prevent XSS
        messageDiv.textContent = content;

        wrapperDiv.appendChild(messageDiv);
        chatContainer.appendChild(wrapperDiv);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Clear input and disable button temporarily
        userInput.value = '';
        sendBtn.disabled = true;
        sendBtn.classList.add('opacity-50', 'cursor-not-allowed');

        // Display user message in UI
        appendMessage('user', text);

        // Add to history
        conversationHistory.push({ role: 'user', content: text });

        try {
            // Send request to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            if (!response.ok) {
                // Display specific technical error returned from backend
                const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
                throw new Error(errorMsg);
            }

            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });

        } catch (error) {
            console.error('Error sending message:', error);
            // Display error clearly to user
            appendMessage('assistant', `عذراً، حدث خطأ: ${error.message}`, true);
        } finally {
            // Re-enable button
            sendBtn.disabled = false;
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            userInput.focus();
        }
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Focus input on load
    userInput.focus();
});