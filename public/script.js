const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex');

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('p-3', 'rounded-lg', 'max-w-[80%]', 'whitespace-pre-wrap');

    // Secure DOM manipulation
    bubbleDiv.textContent = content;

    if (role === 'user') {
        messageDiv.classList.add('justify-end');
        bubbleDiv.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else if (role === 'assistant') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    } else if (role === 'error') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-red-200', 'text-red-800', 'rounded-tr-none');
    }

    messageDiv.appendChild(bubbleDiv);
    chatBox.appendChild(messageDiv);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button while waiting
    userInput.disabled = true;
    sendBtn.disabled = true;
    userInput.value = '';

    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.classList.add('flex', 'justify-start');
    loadingDiv.innerHTML = '<div class="bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none text-sm">جاري التفكير...</div>';
    chatBox.appendChild(loadingDiv);
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

        // Remove loading
        document.getElementById('loading-indicator')?.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ في الاتصال بالخادم.');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading if it exists
        document.getElementById('loading-indicator')?.remove();
        appendMessage('error', 'خطأ: ' + error.message);
        // Remove the last user message from history so they can retry
        conversationHistory.pop();
        userInput.value = text;
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        sendMessage();
    }
});
