document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];

    function appendMessage(role, content, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = role === 'user' ? 'flex justify-end mb-4' : 'flex justify-start mb-4';

        const bubble = document.createElement('div');
        bubble.className = `rounded-lg p-3 max-w-xs md:max-w-md ${
            role === 'user' ? 'bg-blue-600 text-white' :
            isError ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
        }`;

        // Prevent XSS by using textContent and preserving formatting
        bubble.style.whiteSpace = 'pre-wrap';
        bubble.textContent = content;

        messageDiv.appendChild(bubble);
        chatContainer.appendChild(messageDiv);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Display user message
        appendMessage('user', text);
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        // Add to history
        conversationHistory.push({ role: "user", content: text });

        // Add a temporary loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'flex justify-start mb-4';
        loadingDiv.innerHTML = `<div class="bg-gray-200 text-gray-500 rounded-lg p-3 italic">جاري التفكير...</div>`;
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
                throw new Error(data.error || 'حدث خطأ أثناء الاتصال بالخادم');
            }

            const aiResponse = data.choices[0].message.content;

            // Add to history and display
            conversationHistory.push({ role: "assistant", content: aiResponse });
            appendMessage('assistant', aiResponse);

        } catch (error) {
            // Remove loading indicator
            document.getElementById(loadingId)?.remove();
            console.error('Error:', error);
            appendMessage('assistant', error.message, true);
        } finally {
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
