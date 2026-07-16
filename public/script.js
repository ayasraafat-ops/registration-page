const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Append user message
    appendMessage(text, 'user');
    conversationHistory.push({ role: 'user', content: text });

    // Show loading state
    const loadingId = 'loading-' + Date.now();
    appendMessage('...', 'loading', loadingId);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading state
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || 'فشل في الاتصال بالخادم');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage(aiMessage, 'assistant');
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading state
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        appendMessage(`حدث خطأ: ${error.message}`, 'error');
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function appendMessage(text, sender, id = null) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex w-full mb-4 ${sender === 'user' ? 'justify-start' : 'justify-end'}`;

    if (id) {
        messageWrapper.id = id;
    }

    const messageContent = document.createElement('div');

    // Style based on sender
    let bgClass, textClass;
    if (sender === 'user') {
        bgClass = 'bg-blue-600';
        textClass = 'text-white';
    } else if (sender === 'error') {
        bgClass = 'bg-red-200';
        textClass = 'text-red-900';
    } else if (sender === 'loading') {
        bgClass = 'bg-gray-300';
        textClass = 'text-gray-600 animate-pulse';
    } else {
        bgClass = 'bg-gray-200';
        textClass = 'text-gray-900';
    }

    messageContent.className = `max-w-[80%] rounded-2xl p-4 shadow-sm ${bgClass} ${textClass}`;
    messageContent.style.whiteSpace = 'pre-wrap';
    messageContent.textContent = text; // XSS Protection

    messageWrapper.appendChild(messageContent);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
