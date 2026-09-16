const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [
    { role: 'system', content: 'You are a helpful Arabic assistant. Answer in Arabic.' }
];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');

    // Prevent XSS using textContent
    messageBox.textContent = content;

    let baseClasses = 'p-3 rounded-lg shadow max-w-[80%] whitespace-pre-wrap ';
    if (role === 'user') {
        baseClasses += 'bg-blue-100 rounded-tl-none';
    } else {
        baseClasses += isError ? 'bg-red-100 rounded-tr-none text-red-800' : 'bg-white rounded-tr-none';
    }

    messageBox.className = baseClasses;

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex justify-start';
    wrapper.id = 'loading-indicator';

    const messageBox = document.createElement('div');
    messageBox.textContent = 'جاري التفكير...';
    messageBox.className = 'bg-gray-200 p-3 rounded-lg rounded-tr-none shadow max-w-[80%] text-gray-500 animate-pulse';

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Prevent duplicate submissions
    if (sendBtn.disabled) return;

    // Disable input
    sendBtn.disabled = true;
    userInput.disabled = true;

    // Display user message
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

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
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
        } else if (data.choices && data.choices.length > 0) {
            const reply = data.choices[0].message.content;
            appendMessage('assistant', reply);
            conversationHistory.push({ role: 'assistant', content: reply });
        } else {
            appendMessage('assistant', 'لم يتم استلام رد صحيح من الخادم.', true);
        }

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `فشل الاتصال بالخادم: ${error.message}`, true);
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
