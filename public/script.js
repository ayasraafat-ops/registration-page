const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const errorContainer = document.getElementById('error-container');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('flex');

    const messageBox = document.createElement('div');
    messageBox.classList.add('p-3', 'rounded-lg', 'max-w-[80%]', 'shadow');

    // Apply pre-wrap for proper text formatting and protection against XSS
    messageBox.style.whiteSpace = 'pre-wrap';
    messageBox.textContent = content;

    if (role === 'user') {
        // User messages align to the left in RTL (justify-end in RTL context)
        messageWrapper.classList.add('justify-end');
        messageBox.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else if (role === 'assistant') {
        // Assistant messages align to the right in RTL (justify-start in RTL context)
        messageWrapper.classList.add('justify-start');
        messageBox.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    } else if (role === 'error') {
        messageWrapper.classList.add('justify-start');
        messageBox.classList.add('bg-red-200', 'text-red-800', 'rounded-tr-none');
    }

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
    return messageWrapper;
}

function appendLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.classList.add('flex', 'justify-end');

    const box = document.createElement('div');
    box.classList.add('p-3', 'rounded-lg', 'bg-gray-200', 'text-gray-500', 'rounded-tl-none', 'max-w-[80%]', 'shadow', 'italic');
    box.textContent = 'جاري التفكير...'; // "Thinking..."

    wrapper.appendChild(box);
    chatContainer.appendChild(wrapper);
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000);
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Disable input and show loading
    sendButton.disabled = true;
    userInput.disabled = true;
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
            throw new Error(data.error || 'حدث خطأ غير معروف'); // "Unknown error occurred"
        }

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const assistantMsg = data.choices[0].message.content;
            appendMessage('assistant', assistantMsg);
            conversationHistory.push({ role: 'assistant', content: assistantMsg });
        } else {
            throw new Error('لم يتم استلام رد صالح من الخادم'); // "Did not receive a valid response from server"
        }
    } catch (error) {
        removeLoading();
        console.error('Error:', error);
        appendMessage('error', 'حدث خطأ: ' + error.message);
        showError('حدث خطأ أثناء الاتصال بالخادم. ' + error.message);
    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});
