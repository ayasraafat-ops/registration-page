const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let messagesHistory = [];

function appendMessage(role, text, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

    const messageDiv = document.createElement('div');
    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.textContent = text;

    let baseClasses = 'p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg ';

    if (role === 'user') {
        messageDiv.className = baseClasses + 'bg-blue-600 text-white rounded-tl-none';
    } else {
        if (isError) {
             messageDiv.className = baseClasses + 'bg-red-100 text-red-800 rounded-tr-none border border-red-300';
        } else {
             messageDiv.className = baseClasses + 'bg-gray-200 text-gray-800 rounded-tr-none';
        }
    }

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex justify-start';
    wrapperDiv.id = 'loading-indicator';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-100 text-gray-500 p-3 rounded-lg rounded-tr-none italic';
    loadingDiv.textContent = 'جاري الكتابة...';

    wrapperDiv.appendChild(loadingDiv);
    chatContainer.appendChild(wrapperDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendButton.disabled) return;

    // Disable input while processing
    userInput.value = '';
    sendButton.disabled = true;
    userInput.disabled = true;

    // Add user message to UI
    appendMessage('user', text);

    // Add to history
    messagesHistory.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messagesHistory })
        });

        removeLoading();
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage('assistant', `عذراً، حدث خطأ:\n${errorMsg}`, true);
        } else if (data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            messagesHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            appendMessage('assistant', 'لم يتم استلام استجابة صالحة.', true);
        }

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `فشل الاتصال بالخادم:\n${error.message}`, true);
    } finally {
        // Re-enable input
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
