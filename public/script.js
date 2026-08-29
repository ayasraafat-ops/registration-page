let conversationHistory = [];

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Function to safely append messages using document.createElement and textContent (XSS protection)
function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex w-full';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'p-3 rounded-xl shadow-sm max-w-[80%] whitespace-pre-wrap';

    // Apply role-specific styling
    if (role === 'user') {
        wrapperDiv.classList.add('justify-start'); // User aligns right in RTL
        messageDiv.classList.add('bg-indigo-600', 'text-white', 'rounded-tr-none');
    } else if (role === 'assistant') {
        wrapperDiv.classList.add('justify-end'); // Assistant aligns left in RTL
        messageDiv.classList.add('bg-white', 'text-gray-800', 'border', 'border-gray-200', 'rounded-tl-none');
    } else if (role === 'error') {
        wrapperDiv.classList.add('justify-center', 'w-full');
        messageDiv.classList.add('bg-red-200', 'text-red-800', 'border', 'border-red-300', 'text-center', 'text-sm');
    } else if (role === 'loading') {
        wrapperDiv.classList.add('justify-end', 'loading-indicator');
        messageDiv.classList.add('bg-gray-200', 'text-gray-500', 'animate-pulse', 'rounded-tr-none');
    }

    messageDiv.textContent = content;
    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoadingIndicator() {
    const loadingIndicators = chatContainer.querySelectorAll('.loading-indicator');
    loadingIndicators.forEach(indicator => indicator.remove());
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Disable input and button to prevent duplicate requests
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Add user message to UI and history
    appendMessage('user', message);
    conversationHistory.push({ role: 'user', content: message });

    // Add loading indicator
    appendMessage('loading', 'جاري التفكير...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: conversationHistory }),
        });

        const data = await response.json();
        removeLoadingIndicator();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ في الخادم.');
        }

        const assistantMessage = data.choices[0].message.content;

        // Add assistant message to UI and history
        appendMessage('assistant', assistantMessage);
        conversationHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        removeLoadingIndicator();
        console.error('Error:', error);
        appendMessage('error', `خطأ: ${error.message}`);
        // Remove the user message from history so they can try again if they want
        conversationHistory.pop();
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
