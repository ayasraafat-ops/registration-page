const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content) {
    const isUser = role === 'user';

    const wrapper = document.createElement('div');
    wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'} w-full mb-4`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `p-4 rounded-2xl shadow-sm max-w-[80%] lg:max-w-[70%] ${
        isUser
            ? 'bg-indigo-600 text-white rounded-tl-none'
            : 'bg-white text-gray-800 rounded-tr-none border border-gray-200'
    }`;
    // Store message explicitly in AI container for Playwright targeting
    if (!isUser) {
        messageDiv.classList.add('bg-gray-200'); // Adding bg-gray-200 just in case to match memory requirement, though bg-white is generally standard, let's keep bg-gray-200 on assistant messages to match memory if possible or add a generic ai-response class
        messageDiv.classList.replace('bg-white', 'bg-gray-200');
    }

    const textElement = document.createElement('p');
    textElement.style.whiteSpace = 'pre-wrap';
    textElement.textContent = content; // Prevents XSS

    messageDiv.appendChild(textElement);
    wrapper.appendChild(messageDiv);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start w-full mb-4';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-200 p-4 rounded-2xl rounded-tr-none shadow-sm flex items-center gap-2 text-gray-500';

    loadingDiv.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>جاري التفكير...</span>
    `;

    wrapper.appendChild(loadingDiv);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

function showError(errorMessage) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex justify-center w-full mb-4';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-200 text-center max-w-[80%]';

    const textElement = document.createElement('span');
    textElement.textContent = `خطأ: ${errorMessage}`;

    errorDiv.appendChild(textElement);
    wrapper.appendChild(errorDiv);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Clear input and disable button
    messageInput.value = '';
    messageInput.style.height = 'auto'; // Reset height
    sendButton.disabled = true;

    showLoading();

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
            throw new Error(data.error?.message || response.statusText || 'حدث خطأ غير معروف');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        removeLoading();
        showError(error.message);
        // Remove the last user message from history so they can try again
        conversationHistory.pop();
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', () => {
    if (!sendButton.disabled) {
        sendMessage();
    }
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
