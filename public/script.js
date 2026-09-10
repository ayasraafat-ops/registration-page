const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [
    { role: "system", content: "You are a helpful AI assistant. You communicate primarily in Arabic." }
];

function appendMessage(role, text) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const messageDiv = document.createElement('div');

    // Style differently based on role
    if (role === 'user') {
        messageDiv.className = 'bg-blue-600 text-white rounded-lg py-2 px-4 max-w-[85%] rounded-tl-none shadow-sm';
    } else if (role === 'error') {
        messageDiv.className = 'bg-red-100 text-red-800 border border-red-300 rounded-lg py-2 px-4 max-w-[85%] rounded-tr-none shadow-sm';
    } else { // assistant
        messageDiv.className = 'bg-gray-200 text-gray-800 rounded-lg py-2 px-4 max-w-[85%] rounded-tr-none shadow-sm';
    }

    const textPara = document.createElement('p');
    textPara.className = 'whitespace-pre-wrap';
    textPara.textContent = text; // Safe against XSS

    messageDiv.appendChild(textPara);
    messageWrapper.appendChild(messageDiv);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageWrapper;
}

function appendLoading() {
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.className = 'flex justify-start';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-200 text-gray-500 rounded-lg py-2 px-4 max-w-[85%] rounded-tr-none shadow-sm text-sm italic';
    loadingDiv.textContent = 'جاري التفكير...';

    loadingWrapper.appendChild(loadingDiv);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loadingWrapper = document.getElementById('loading-indicator');
    if (loadingWrapper) {
        loadingWrapper.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    // Append user message
    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto'; // Reset textarea height

    // Disable inputs
    sendBtn.disabled = true;
    userInput.disabled = true;

    // Add to history
    conversationHistory.push({ role: "user", content: text });

    appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            throw new Error(data?.error?.message || "حدث خطأ غير معروف.");
        }

        const aiResponse = data.choices[0].message.content;
        appendMessage('assistant', aiResponse);

        // Add to history
        conversationHistory.push({ role: "assistant", content: aiResponse });

    } catch (error) {
        removeLoading();
        appendMessage('error', `خطأ: ${error.message}`);
        // Remove the failed message from history so user can try again
        conversationHistory.pop();
    } finally {
        // Re-enable inputs
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Handle Enter key (Shift+Enter for new line)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
});

sendBtn.addEventListener('click', sendMessage);
