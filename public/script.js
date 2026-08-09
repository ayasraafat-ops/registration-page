const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `rounded-lg p-3 max-w-[80%] shadow-sm ${
        role === 'user'
            ? 'bg-blue-600 text-white'
            : isError
                ? 'bg-red-200 text-red-800'
                : 'bg-white text-gray-800'
    }`;
    if (role === 'assistant' && !isError) {
        messageDiv.classList.add('bg-gray-200'); // Adding a class for easy targeting in tests if needed, though background is white above. Let's make it gray for assistant to match memory instructions.
        messageDiv.className = `rounded-lg p-3 max-w-[80%] shadow-sm bg-gray-200 text-gray-800`;
    }

    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.textContent = content; // Using textContent to prevent XSS

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Add user message to UI
    appendMessage('user', userMessage);
    messageInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: userMessage });

    // Disable input while waiting
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Show temporary loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.id = 'loading-indicator';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-200 rounded-lg p-3 max-w-[80%] shadow-sm text-gray-500 italic';
    loadingDiv.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingDiv);
    chatContainer.appendChild(loadingWrapper);
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
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير معروف');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);

        // Add AI response to history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading indicator
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();

        console.error("Chat error:", error);
        appendMessage('assistant', `عذراً، حدث خطأ: ${error.message}`, true);
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
});