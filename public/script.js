const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

let conversationHistory = [];

function appendMessage(content, isUser) {
    const wrapperDiv = document.createElement('div');
    // Align user messages to the left in RTL, and assistant to the right
    wrapperDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `rounded-lg p-3 max-w-[80%] shadow-sm ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
    }`;

    const textPara = document.createElement('p');
    textPara.className = 'whitespace-pre-wrap';
    // Use textContent to prevent XSS
    textPara.textContent = content;

    messageDiv.appendChild(textPara);
    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setLoading(isLoading) {
    if (isLoading) {
        sendButton.disabled = true;
        sendButton.classList.add('opacity-75', 'cursor-not-allowed');
        sendButton.querySelector('span').classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
    } else {
        sendButton.disabled = false;
        sendButton.classList.remove('opacity-75', 'cursor-not-allowed');
        sendButton.querySelector('span').classList.remove('hidden');
        loadingSpinner.classList.add('hidden');
    }
}

function showError(message) {
    if (message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    } else {
        errorMessage.classList.add('hidden');
    }
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear input and error, show user message
    userInput.value = '';
    showError(null);
    appendMessage(text, true);

    // Update history
    conversationHistory.push({ role: 'user', content: text });

    setLoading(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير معروف');
        }

        const replyContent = data.choices[0].message.content;

        // Append to UI
        appendMessage(replyContent, false);

        // Update history
        conversationHistory.push({ role: 'assistant', content: replyContent });

    } catch (error) {
        console.error('Error:', error);
        showError(`خطأ: ${error.message}`);
        // Remove the user message from history if the request failed to allow retry
        conversationHistory.pop();
    } finally {
        setLoading(false);
    }
}

// Event Listeners
sendButton.addEventListener('click', handleSend);

userInput.addEventListener('keydown', (e) => {
    // Send on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
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
