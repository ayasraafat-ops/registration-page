const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');
const loadingIndicator = document.getElementById('loading-indicator');

let conversationHistory = [];

function appendMessage(role, text) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');

    let boxClasses = 'p-4 rounded-lg max-w-[80%] whitespace-pre-wrap shadow-sm ';
    if (role === 'user') {
        boxClasses += 'bg-blue-600 text-white rounded-tl-none'; // Right aligned for RTL user messages
    } else if (role === 'assistant') {
        boxClasses += 'bg-gray-200 text-gray-800 rounded-tr-none'; // Left aligned for RTL assistant messages
    } else { // Error
        boxClasses += 'bg-red-200 text-red-800 border border-red-300';
    }

    messageBox.className = boxClasses;
    // Using textContent to prevent XSS
    messageBox.textContent = text;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    // Disable input and show loading
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    loadingIndicator.classList.remove('hidden');

    appendMessage('user', messageText);

    conversationHistory.push({ role: 'user', content: messageText });

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
            throw new Error(data.error || 'Unknown error occurred');
        }

        const assistantMessage = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        if (assistantMessage) {
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            throw new Error('Invalid response format from server');
        }

    } catch (error) {
        console.error('Error:', error);
        appendMessage('error', `حدث خطأ: ${error.message}`);
        // Optionally remove the last user message from history if it failed
        conversationHistory.pop();
    } finally {
        // Re-enable input and hide loading
        messageInput.disabled = false;
        sendButton.disabled = false;
        loadingIndicator.classList.add('hidden');
        messageInput.focus();
    }
});
