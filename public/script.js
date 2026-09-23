const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let conversationHistory = [
    { role: 'system', content: 'أنت مساعد ذكاء اصطناعي مفيد.' }
];

// Function to append a message to the chat
function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex');

    // User messages to the left (RTL: justify-end), AI to the right (RTL: justify-start)
    if (role === 'user') {
        wrapper.classList.add('justify-end');
    } else {
        wrapper.classList.add('justify-start');
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('p-3', 'rounded-lg', 'shadow', 'max-w-[80%]', 'break-words');
    messageDiv.style.whiteSpace = 'pre-wrap';

    // Set text content to prevent XSS
    messageDiv.textContent = content;

    if (role === 'user') {
        messageDiv.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tl-none');
    } else {
        if (isError) {
            messageDiv.classList.add('bg-red-100', 'text-red-900', 'rounded-tr-none');
        } else {
            messageDiv.classList.add('bg-white', 'text-gray-800', 'rounded-tr-none');
        }
    }

    wrapper.appendChild(messageDiv);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapper;
}

// Function to handle sending a message
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button while processing
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Append user message
    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.classList.add('flex', 'justify-start');
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('bg-gray-200', 'text-gray-600', 'p-3', 'rounded-lg', 'rounded-tr-none', 'shadow', 'animate-pulse');
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
            // Handle API errors
            const errorMessage = (data.error && data.error.message)
                ? `خطأ: ${data.error.message}`
                : 'حدث خطأ غير معروف.';
            appendMessage('assistant', errorMessage, true);
            console.error("Chat Error:", errorMessage);
        } else {
            // Success
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        // Remove loading indicator
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();

        // Handle network or other errors
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
        console.error("Network/Fetch Error:", error);
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', () => {
    if (!sendButton.disabled) {
        sendMessage();
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value === '') {
        this.style.height = 'auto';
    }
});
