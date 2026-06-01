const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const errorBanner = document.getElementById('error-banner');
const errorMessageSpan = document.getElementById('error-message');

let conversationHistory = [];

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight < 128 ? this.scrollHeight : 128) + 'px';
    if(this.value === '') {
        this.style.height = 'auto';
    }
});

function showError(message) {
    errorMessageSpan.textContent = message;
    errorBanner.classList.remove('hidden');
    setTimeout(() => {
        errorBanner.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

function hideError() {
    errorBanner.classList.add('hidden');
}

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'w-full');

    // User message aligns right in RTL visually (which means justify-start since RTL),
    // wait, in RTL:
    // flex-row (default) goes right-to-left.
    // justify-start means align to the "start" of the main axis, which is RIGHT in RTL.
    // justify-end means align to the "end" of the main axis, which is LEFT in RTL.
    // Memory says: User messages to the left ('justify-end'), assistant messages to the right ('justify-start').

    const alignmentClass = role === 'user' ? 'justify-end' : 'justify-start';
    messageDiv.classList.add(alignmentClass);

    const bubbleDiv = document.createElement('div');
    const baseClasses = ['rounded-2xl', 'px-5', 'py-3', 'max-w-[85%]', 'sm:max-w-[75%]', 'shadow-sm'];

    if (role === 'user') {
        bubbleDiv.classList.add(...baseClasses, 'bg-indigo-600', 'text-white', 'rounded-tl-sm');
    } else {
        bubbleDiv.classList.add(...baseClasses, 'bg-gray-100', 'text-gray-800', 'rounded-tr-sm');
    }

    const textP = document.createElement('p');
    textP.classList.add('message-content');
    textP.textContent = content; // XSS protection via textContent

    bubbleDiv.appendChild(textP);
    messageDiv.appendChild(bubbleDiv);
    chatBox.appendChild(messageDiv);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'typing-indicator';
    messageDiv.classList.add('flex', 'w-full', 'justify-start');

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bg-gray-100', 'rounded-2xl', 'rounded-tr-sm', 'px-5', 'py-3', 'shadow-sm', 'flex', 'space-x-1', 'space-x-reverse', 'items-center');

    for(let i=0; i<3; i++) {
        const dot = document.createElement('div');
        dot.classList.add('w-2', 'h-2', 'bg-gray-400', 'rounded-full', 'animate-bounce');
        if(i===1) dot.style.animationDelay = '0.2s';
        if(i===2) dot.style.animationDelay = '0.4s';
        bubbleDiv.appendChild(dot);
    }

    messageDiv.appendChild(bubbleDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    hideError();

    // Add user message to UI
    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto'; // Reset height
    userInput.disabled = true;
    sendBtn.disabled = true;
    sendBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    appendTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        removeTypingIndicator();

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
        }

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            throw new Error("تنسيق غير متوقع للاستجابة من الخادم.");
        }

    } catch (error) {
        removeTypingIndicator();
        console.error('Error sending message:', error);
        showError(`حدث خطأ: ${error.message}`);
        // Remove the user message from history if it failed so they can try again
        conversationHistory.pop();
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
