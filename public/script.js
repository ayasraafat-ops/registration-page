document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    const appendMessage = (content, sender) => {
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

        const bubble = document.createElement('div');
        bubble.className = `p-3 rounded-lg max-w-[80%] shadow-sm ${
            sender === 'user' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'
        }`;

        // Simple text to handle line breaks
        bubble.innerText = content;

        wrapper.appendChild(bubble);
        chatBox.appendChild(wrapper);

        // Scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const setSendingState = (isSending) => {
        userInput.disabled = isSending;
        sendBtn.disabled = isSending;

        if (isSending) {
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    };

    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        userInput.value = '';
        setSendingState(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (response.ok) {
                appendMessage(data.message, 'ai');
            } else {
                appendMessage(`Error: ${data.error || 'Failed to get response'}`, 'ai');
            }
        } catch (error) {
            console.error('Error:', error);
            appendMessage('Error: Unable to connect to the server.', 'ai');
        } finally {
            setSendingState(false);
            userInput.focus();
        }
    };

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
