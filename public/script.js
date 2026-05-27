const chatForm = document.getElementById('chat-form');
const userInputElement = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const errorBanner = document.getElementById('error-banner');
const errorMessageElement = document.getElementById('error-message');
const sendButton = document.getElementById('send-button');

// Store conversation history for context
let conversationHistory = [];

// Helper to show errors
function showError(message) {
    errorMessageElement.textContent = message;
    errorBanner.classList.remove('hidden');
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorBanner.classList.add('hidden');
    }, 5000);
}

// Function to append a message to the UI
function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex';

    // In RTL:
    // User message should align to the right visually (which means starting from the right in RTL, or 'justify-start' relative to RTL flex, but Tailwind's justify-end pushes to the left in RTL. Wait, in RTL: justify-start is right, justify-end is left.
    // Memory says: user messages should be aligned to the left (using 'justify-end' in flex container), assistant to the right ('justify-start').
    if (role === 'user') {
        messageWrapper.classList.add('justify-end'); // Pushes to the left in RTL
    } else {
        messageWrapper.classList.add('justify-start'); // Pushes to the right in RTL
    }

    const messageBubble = document.createElement('div');
    messageBubble.className = 'rounded-lg p-3 max-w-[80%] break-words shadow-sm';

    if (role === 'user') {
        messageBubble.classList.add('bg-blue-600', 'text-white');
    } else {
        messageBubble.classList.add('bg-gray-200', 'text-gray-800');
    }

    // XSS Protection: use textContent and pre-wrap for formatting
    messageBubble.textContent = content;
    messageBubble.style.whiteSpace = 'pre-wrap';

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userInput = userInputElement.value.trim();
    if (!userInput) return;

    // Clear input
    userInputElement.value = '';

    // Disable input and button while loading
    userInputElement.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = 'جاري الإرسال...';

    // 1. Display user message in UI
    appendMessage('user', userInput);

    // 2. Add to history
    conversationHistory.push({ role: 'user', content: userInput });

    try {
        // 3. Send to backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle backend errors
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            throw new Error(`Error: ${response.status} - ${errorMsg}`);
        }

        // 4. Extract assistant response
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const assistantMessage = data.choices[0].message.content;

            // Add to history
            conversationHistory.push({ role: 'assistant', content: assistantMessage });

            // Display in UI
            appendMessage('assistant', assistantMessage);
        } else {
            throw new Error('تنسيق الاستجابة غير متوقع من الخادم');
        }

    } catch (error) {
        console.error('Chat Error:', error);
        showError(error.message || 'فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
        // Remove the user's message from history if it failed, so they can try again
        conversationHistory.pop();
    } finally {
        // Re-enable input and button
        userInputElement.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = 'إرسال';
        userInputElement.focus();
    }
});

// Allow Enter key to submit (without Shift)
userInputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // Only submit if form is valid and button is not disabled
        if (!sendButton.disabled) {
            chatForm.dispatchEvent(new Event('submit'));
        }
    }
});
