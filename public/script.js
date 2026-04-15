document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');

    // Conversation history to maintain context
    let conversationHistory = [
        { role: 'system', content: 'You are a helpful AI assistant powered by Qwen3.6-plus. You communicate primarily in Arabic since the user asked in Arabic, but can understand and reply in English when needed. Your primary goal is to help users build websites.' }
    ];

    // Handle Enter key for textarea
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to UI
        addMessageToUI(message, 'user');

        // Update history
        conversationHistory.push({ role: 'user', content: message });

        // Clear input and disable button
        userInput.value = '';
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        // Add loading indicator
        const loadingId = addLoadingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Remove loading indicator
            removeElement(loadingId);

            if (data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content;
                addMessageToUI(aiResponse, 'assistant');
                conversationHistory.push({ role: 'assistant', content: aiResponse });
            } else if (data.error) {
                 addMessageToUI(`Error: ${data.error}`, 'system');
            } else {
                 addMessageToUI('Sorry, I received an unexpected response format.', 'system');
            }

        } catch (error) {
            console.error('Error during chat request:', error);
            removeElement(loadingId);
            addMessageToUI('Sorry, there was an error communicating with the server.', 'system');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            userInput.focus();
        }
    });

    function addMessageToUI(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start ${sender === 'user' ? 'flex-row-reverse' : ''}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = `rounded-full p-2 flex-shrink-0 ${
            sender === 'user' ? 'bg-blue-500 ml-3' :
            sender === 'system' ? 'bg-red-100 mr-3' : 'bg-blue-100 mr-3'
        }`;

        const icon = document.createElement('i');
        icon.className = sender === 'user' ? 'fas fa-user text-white' :
                         sender === 'system' ? 'fas fa-exclamation-triangle text-red-500' : 'fas fa-robot text-blue-600';
        avatarDiv.appendChild(icon);

        const textDiv = document.createElement('div');
        textDiv.className = `rounded-lg py-2 px-4 max-w-[80%] whitespace-pre-wrap ${
            sender === 'user' ? 'bg-blue-500 text-white' :
            sender === 'system' ? 'bg-red-50 text-red-800' : 'bg-gray-100 text-gray-800'
        }`;
        textDiv.dir = 'auto'; // Support RTL/LTR automatically
        textDiv.textContent = content;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(textDiv);

        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.id = id;
        messageDiv.className = 'flex items-start';

        messageDiv.innerHTML = `
            <div class="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                <i class="fas fa-robot text-blue-600"></i>
            </div>
            <div class="bg-gray-100 rounded-lg py-3 px-4 max-w-[80%] text-gray-800 flex items-center space-x-2">
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
        `;

        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return id;
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
