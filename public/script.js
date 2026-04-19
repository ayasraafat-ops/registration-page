const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Keep track of the conversation history
let conversationHistory = [];

function addMessageToUI(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = role === 'user'
        ? 'bg-blue-600 text-white p-4 rounded-xl rounded-tl-none shadow max-w-[80%]'
        : 'bg-white text-gray-800 p-4 rounded-xl rounded-tr-none shadow max-w-[80%] whitespace-pre-wrap';

    // Simple text content assignment for safety and basic formatting
    bubbleDiv.textContent = content;

    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingIndicator() {
    const id = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex justify-start';
    messageDiv.id = id;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bg-gray-200 text-gray-500 p-4 rounded-xl rounded-tr-none shadow max-w-[80%] flex items-center gap-2';

    bubbleDiv.innerHTML = `
        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
    `;

    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return id;
}

function removeLoadingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    addMessageToUI('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Clear input and disable form
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Show loading
    const loadingId = addLoadingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices.length > 0) {
            const assistantMessage = data.choices[0].message.content;

            // Remove loading
            removeLoadingIndicator(loadingId);

            // Add assistant response to UI
            addMessageToUI('assistant', assistantMessage);

            // Add to history
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            throw new Error(data.error || 'Failed to get response');
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeLoadingIndicator(loadingId);
        addMessageToUI('assistant', 'عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
        // Re-enable form
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
});
