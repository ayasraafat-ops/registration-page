const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const errorContainer = document.getElementById('error-message');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex ' + (role === 'user' ? 'justify-start' : 'justify-end');

    const bubbleDiv = document.createElement('div');
    // For user, justify-start (right side in RTL)
    // For assistant, justify-end (left side in RTL)

    if (role === 'user') {
        bubbleDiv.className = 'bg-blue-600 text-white rounded-lg p-3 max-w-[80%] rounded-tl-none';
    } else if (role === 'assistant') {
        bubbleDiv.className = 'bg-gray-200 text-gray-900 rounded-lg p-3 max-w-[80%] rounded-tr-none';
    } else {
        // error
        bubbleDiv.className = 'bg-red-100 text-red-900 rounded-lg p-3 max-w-[80%] border border-red-300';
    }

    const textP = document.createElement('p');
    textP.className = 'message-content';
    textP.textContent = content; // Using textContent for XSS protection

    bubbleDiv.appendChild(textP);
    messageDiv.appendChild(bubbleDiv);
    chatBox.appendChild(messageDiv);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000);
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Clear input and error
    messageInput.value = '';
    errorContainer.classList.add('hidden');

    // Display user message
    appendMessage('user', userMessage);

    // Add to history
    conversationHistory.push({ role: 'user', content: userMessage });

    // Show loading state (optional)
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'flex justify-end';
    loadingDiv.innerHTML = '<div class="bg-gray-100 text-gray-500 rounded-lg p-3 max-w-[80%] rounded-tr-none animate-pulse">جاري التفكير...</div>';
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

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
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            const errorMessage = data.error || 'حدث خطأ غير معروف';
            appendMessage('error', `Error: ${errorMessage}`);
            showError(`Error: ${errorMessage}`);
            return;
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);

        // Add AI response to history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        console.error('Fetch error:', error);
        appendMessage('error', `Error: ${error.message}`);
        showError(`Error: ${error.message}`);
    }
});
