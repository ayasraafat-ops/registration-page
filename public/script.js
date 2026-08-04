const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const submitButton = document.getElementById('submit-button');
const welcomeMessage = document.getElementById('welcome-message');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `flex w-full mb-4 ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const innerDiv = document.createElement('div');
    // user (right side due to dir=rtl and justify-start) - Blue
    // assistant (left side due to justify-end) - Gray
    let bgClass = role === 'user' ? 'bg-blue-100 text-blue-900 border-blue-200' : 'bg-gray-200 text-gray-800 border-gray-300';
    if (isError) {
        bgClass = 'bg-red-200 text-red-900 border-red-300';
    }

    innerDiv.className = `max-w-[80%] rounded-lg px-4 py-3 border ${bgClass} shadow-sm`;
    innerDiv.style.whiteSpace = 'pre-wrap'; // Important for multi-line formatting
    innerDiv.textContent = content; // XSS protection

    messageDiv.appendChild(innerDiv);
    chatContainer.appendChild(messageDiv);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageDiv; // return to allow removing loading indicator later if needed
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'flex w-full mb-4 justify-end';
    loadingDiv.innerHTML = `
        <div class="max-w-[80%] rounded-lg px-4 py-3 bg-gray-200 text-gray-500 flex items-center gap-2">
            <span class="animate-pulse">...</span> يكتب
        </div>
    `;
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return loadingDiv;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Disable input while processing
    messageInput.value = '';
    messageInput.disabled = true;
    submitButton.disabled = true;

    // Display user message
    appendMessage('user', userMessage);

    // Update history
    conversationHistory.push({ role: 'user', content: userMessage });

    const loadingIndicator = showLoading();

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
        loadingIndicator.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ في الاتصال بالخادم');
        }

        const aiMessage = data.choices[0].message.content;

        // Display AI message
        appendMessage('assistant', aiMessage);

        // Update history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        if (loadingIndicator.parentNode) {
            loadingIndicator.remove();
        }
        appendMessage('assistant', `حدث خطأ: ${error.message}`, true);
        console.error('Chat Error:', error);
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        submitButton.disabled = false;
        messageInput.focus();
    }
});
