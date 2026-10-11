const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let messages = [
    { role: 'system', content: 'You are a helpful Arabic AI assistant.' }
];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');

    // Use justify-end for user (left side in RTL) and justify-start for AI (right side in RTL)
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');

    // Base styles
    bubble.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-tl-none'
            : isError
                ? 'bg-red-100 text-red-700 border border-red-300 rounded-tr-none'
                : 'bg-gray-200 text-gray-800 rounded-tr-none'
    }`;

    // Prevent XSS by strictly using textContent
    bubble.textContent = content;

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tr-none max-w-[80%] flex gap-1 items-center';

    // Simple typing animation
    bubble.innerHTML = '<span class="animate-bounce">.</span><span class="animate-bounce" style="animation-delay: 0.1s">.</span><span class="animate-bounce" style="animation-delay: 0.2s">.</span>';

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Append user message to UI and history
    appendMessage('user', text);
    messages.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            // Display specific technical error details
            appendMessage('assistant', `حدث خطأ: ${data.error}`, true);
            // Don't save failed messages to context history to avoid clutter
        } else if (data.choices && data.choices.length > 0) {
            const aiText = data.choices[0].message.content;
            appendMessage('assistant', aiText);
            messages.push({ role: 'assistant', content: aiText });
        } else {
            appendMessage('assistant', 'حدث خطأ غير معروف في الاستجابة.', true);
        }
    } catch (error) {
        removeLoading();
        appendMessage('assistant', `تعذر الاتصال بالخادم: ${error.message}`, true);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // Prevent duplicate submissions
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
