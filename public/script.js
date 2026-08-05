let conversationHistory = [];

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loadingIndicator = document.getElementById('loading-indicator');

function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex w-full my-2 ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageDiv = document.createElement('div');

    if (role === 'user') {
        messageDiv.className = 'bg-blue-100 text-blue-900 px-4 py-2 rounded-lg max-w-[80%]';
    } else if (role === 'error') {
        messageDiv.className = 'bg-red-200 text-red-900 px-4 py-2 rounded-lg max-w-[80%] font-bold';
    } else {
        messageDiv.className = 'bg-gray-200 text-gray-900 px-4 py-2 rounded-lg max-w-[80%]';
    }

    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);

    // Insert before loading indicator so loading always stays at bottom if visible
    chatContainer.insertBefore(wrapperDiv, loadingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear input
    userInput.value = '';

    // Append user message to UI
    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading
    loadingIndicator.classList.remove('hidden');
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

        if (!response.ok) {
            throw new Error(data.error || 'Network response was not ok');
        }

        const aiMessage = data.choices[0].message.content;

        // Append AI message to UI
        appendMessage('assistant', aiMessage);

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        console.error('Error:', error);
        appendMessage('error', `حدث خطأ: ${error.message}`);
        // Remove the failed message from history so it can be retried if needed
        conversationHistory.pop();
    } finally {
        // Hide loading
        loadingIndicator.classList.add('hidden');
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
