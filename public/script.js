const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history for context
let conversationHistory = [];

/**
 * Appends a message to the chat container.
 * In an RTL layout:
 * - User messages align right (justify-start)
 * - AI messages align left (justify-end)
 * Uses textContent and white-space: pre-wrap for XSS protection.
 */
function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex w-full ' + (role === 'user' ? 'justify-start' : 'justify-end');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'p-3 max-w-[80%] md:max-w-xl shadow whitespace-pre-wrap ';

    if (role === 'user') {
        // User styling (right aligned tail)
        messageDiv.className += 'bg-indigo-600 text-white rounded-xl rounded-tr-none';
    } else if (role === 'assistant') {
        // Assistant styling (left aligned tail)
        messageDiv.className += 'bg-gray-200 text-gray-800 rounded-xl rounded-tl-none';
    } else if (role === 'error') {
        // Error styling
        messageDiv.className += 'bg-red-200 text-red-800 rounded-xl rounded-tl-none border border-red-300';
    }

    messageDiv.textContent = content;
    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to handle sending message
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Display user message
    appendMessage('user', text);
    userInput.value = '';

    // Disable input while fetching
    userInput.disabled = true;
    sendButton.disabled = true;

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show temporary loading
    const loadingId = 'loading-' + Date.now();
    const loadingWrapperDiv = document.createElement('div');
    loadingWrapperDiv.id = loadingId;
    loadingWrapperDiv.className = 'flex w-full justify-end';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-100 text-gray-500 p-3 rounded-xl rounded-tl-none max-w-[80%] md:max-w-xl shadow flex gap-1 items-center';
    loadingDiv.innerHTML = '<span class="animate-pulse">.</span><span class="animate-pulse delay-100">.</span><span class="animate-pulse delay-200">.</span> جاري التفكير';

    loadingWrapperDiv.appendChild(loadingDiv);
    chatContainer.appendChild(loadingWrapperDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        // Remove loading
        document.getElementById(loadingId).remove();

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير معروف.');
        }

        const aiMessage = data.choices[0].message.content;

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

        // Display AI message
        appendMessage('assistant', aiMessage);

    } catch (error) {
        // Remove loading if it still exists
        const loadEl = document.getElementById(loadingId);
        if (loadEl) loadEl.remove();

        // Display specific error message
        appendMessage('error', `حدث خطأ: ${error.message}`);

        // Remove the failed user message from history so they can retry
        conversationHistory.pop();
    } finally {
        // Re-enable input
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
