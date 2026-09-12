const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

    const messageDiv = document.createElement('div');

    if (role === 'user') {
        messageDiv.className = 'bg-blue-600 text-white rounded-lg p-3 max-w-[80%] rounded-tl-none shadow-sm';
    } else {
        if (isError) {
            messageDiv.className = 'bg-red-100 text-red-800 border border-red-200 rounded-lg p-3 max-w-[80%] rounded-tr-none shadow-sm';
        } else {
            messageDiv.className = 'bg-gray-200 text-gray-800 rounded-lg p-3 max-w-[80%] rounded-tr-none shadow-sm';
        }
    }

    // Use textContent with pre-wrap to prevent XSS while maintaining whitespace
    messageDiv.textContent = content;
    messageDiv.style.whiteSpace = 'pre-wrap';

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = 'loading-indicator';
    wrapperDiv.className = 'flex justify-start';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'bg-gray-100 text-gray-500 rounded-lg p-3 max-w-[80%] rounded-tr-none italic text-sm';
    messageDiv.textContent = 'جاري التفكير...';

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    sendBtn.disabled = true;
    userInput.disabled = true;

    // Display user message
    appendMessage('user', text);
    userInput.value = '';

    // Update conversation history
    conversationHistory.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            const errorMsg = data.error?.message || 'حدث خطأ غير معروف';
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
            // Optionally remove the user's message from history if it failed
            conversationHistory.pop();
        } else {
            const aiContent = data.choices[0].message.content;
            appendMessage('assistant', aiContent);
            conversationHistory.push({ role: 'assistant', content: aiContent });
        }
    } catch (error) {
        removeLoading();
        appendMessage('assistant', `عذراً، حدث خطأ في الاتصال: ${error.message}`, true);
        conversationHistory.pop();
    } finally {
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        sendMessage();
    }
});
