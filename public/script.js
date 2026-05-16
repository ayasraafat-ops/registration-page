const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let chatHistory = [];

function handleKeyDown(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex';

    // In RTL:
    // User message -> left (justify-end)
    // Assistant message -> right (justify-start)
    if (role === 'user') {
        wrapperDiv.classList.add('justify-end');
    } else {
        wrapperDiv.classList.add('justify-start');
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'rounded-lg p-3 shadow-md max-w-[80%] whitespace-pre-wrap';

    if (isError) {
        messageDiv.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-300');
    } else if (role === 'user') {
        messageDiv.classList.add('bg-blue-100', 'text-blue-900');
    } else {
        messageDiv.classList.add('bg-white', 'text-gray-800');
    }

    // Set textContent for XSS protection
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Auto-scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function showLoading() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex justify-start';
    wrapperDiv.id = 'loading-indicator';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'bg-gray-200 text-gray-500 rounded-lg p-3 shadow-sm max-w-[80%] italic';
    messageDiv.textContent = 'جاري التفكير...';

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const messageText = userInput.value.trim();
    if (!messageText) return;

    // Disable input while processing
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    appendMessage('user', messageText);

    chatHistory.push({ role: 'user', content: messageText });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });

        removeLoading();

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
            // Optionally remove the user message from history if it failed
            // chatHistory.pop();
        } else if (data.choices && data.choices.length > 0) {
            const assistantMsg = data.choices[0].message.content;
            appendMessage('assistant', assistantMsg);
            chatHistory.push({ role: 'assistant', content: assistantMsg });
        } else {
            appendMessage('assistant', 'لم يتم تلقي رد صحيح من الخادم.', true);
        }

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}
