const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add('flex');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('p-3', 'rounded-lg', 'max-w-[80%]', 'whitespace-pre-wrap');

    messageDiv.textContent = content; // Using textContent for XSS protection

    if (role === 'user') {
        wrapperDiv.classList.add('justify-end');
        messageDiv.classList.add('bg-blue-500', 'text-white', 'rounded-tl-none');
    } else if (role === 'assistant') {
        wrapperDiv.classList.add('justify-start');
        messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    } else if (role === 'error') {
        wrapperDiv.classList.add('justify-center', 'w-full');
        messageDiv.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-400', 'text-center', 'w-full', 'max-w-full');
    }

    wrapperDiv.appendChild(messageDiv);
    chatBox.appendChild(wrapperDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button while loading
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.classList.add('flex', 'justify-start');
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('p-3', 'rounded-lg', 'bg-gray-100', 'text-gray-500', 'rounded-tr-none');
    loadingDiv.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingDiv);
    chatBox.appendChild(loadingWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

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
        document.getElementById(loadingId)?.remove();

        if (!response.ok) {
            const errorMessage = data.error?.message || 'حدث خطأ غير معروف';
            appendMessage('error', 'خطأ: ' + errorMessage);
        } else {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        }
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        appendMessage('error', 'خطأ في الاتصال بالخادم: ' + error.message);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
