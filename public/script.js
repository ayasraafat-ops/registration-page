const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const sendButton = document.getElementById('send-button');
const errorContainer = document.getElementById('error-message');

// Store conversation history
let messages = [
    { role: "system", content: "أنت مساعد ذكي ومفيد. تتحدث باللغة العربية." }
];

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex');

    // In RTL:
    // User messages align left (justify-end in ltr conceptually, but here we just use justify-end for user, justify-start for assistant)
    // Wait, in RTL mode (dir="rtl"):
    // 'justify-start' aligns to the right side.
    // 'justify-end' aligns to the left side.
    if (role === 'user') {
        messageDiv.classList.add('justify-end'); // Left side
    } else {
        messageDiv.classList.add('justify-start'); // Right side
    }

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'p-3', 'max-w-[80%]', 'whitespace-pre-wrap');

    if (role === 'user') {
        bubbleDiv.classList.add('bg-blue-600', 'text-white');
    } else if (role === 'assistant') {
        bubbleDiv.classList.add('bg-blue-100', 'text-blue-900');
    } else if (role === 'error') {
        bubbleDiv.classList.add('bg-red-100', 'text-red-900', 'border', 'border-red-500');
    } else if (role === 'loading') {
        bubbleDiv.classList.add('bg-gray-200', 'text-gray-600', 'italic');
        bubbleDiv.id = 'loading-message';
    }

    // Set textContent to prevent XSS
    bubbleDiv.textContent = content;

    messageDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingMessage() {
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg && loadingMsg.parentElement) {
        loadingMsg.parentElement.remove();
    }
}

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
        errorContainer.textContent = '';
    }, 5000);
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = userInput.value.trim();
    if (!userText) return;

    // Disable input and button while processing
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;
    errorContainer.classList.add('hidden');

    // Add user message to UI and history
    appendMessage('user', userText);
    messages.push({ role: "user", content: userText });

    // Show loading
    appendMessage('loading', 'جاري التفكير...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messages })
        });

        const data = await response.json();
        removeLoadingMessage();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : "حدث خطأ غير معروف.";
            throw new Error(errorMsg);
        }

        const assistantMessage = data.choices[0].message.content;

        // Add assistant message to UI and history
        appendMessage('assistant', assistantMessage);
        messages.push({ role: "assistant", content: assistantMessage });

    } catch (error) {
        removeLoadingMessage();
        console.error("Error:", error);
        appendMessage('error', `عذراً، حدث خطأ: ${error.message}`);
        // Remove the last user message from history so they can try again if they want
        messages.pop();
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
});
