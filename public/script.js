const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let messages = [
    { role: 'system', content: 'أنت مساعد ذكي ومفيد تتحدث باللغة العربية.' }
];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const bubble = document.createElement('div');
    // Base styles
    bubble.className = `rounded-lg p-3 max-w-[80%] shadow whitespace-pre-wrap `;

    if (role === 'user') {
        bubble.className += 'bg-blue-600 text-white';
    } else {
        if (isError) {
            bubble.className += 'bg-red-200 text-red-900 font-bold';
        } else {
            bubble.className += 'bg-gray-200 text-gray-800';
        }
    }

    // Protect against XSS
    bubble.textContent = content;

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    // Auto scroll
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show a temporary loading indicator
function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = `flex w-full justify-end`;

    const bubble = document.createElement('div');
    bubble.className = `bg-gray-100 text-gray-500 rounded-lg p-3 max-w-[80%] shadow`;
    bubble.textContent = 'جاري التفكير...';

    wrapper.appendChild(bubble);
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

    // UI Updates for user message
    appendMessage('user', text);
    userInput.value = '';
    sendButton.disabled = true;
    userInput.disabled = true;

    // Add to history
    messages.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'خطأ غير معروف';
            appendMessage('assistant', `حدث خطأ: ${errorMsg}`, true);
        } else {
            const reply = data.choices[0].message.content;
            appendMessage('assistant', reply);
            // Save reply to history
            messages.push({ role: 'assistant', content: reply });
        }
    } catch (error) {
        removeLoading();
        appendMessage('assistant', `تعذر الاتصال بالخادم: ${error.message}`, true);
    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
