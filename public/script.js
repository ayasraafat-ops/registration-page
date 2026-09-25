const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex mb-4 ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');
    let bubbleClass = 'p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg shadow whitespace-pre-wrap ';

    if (role === 'user') {
        bubbleClass += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        if (isError) {
            bubbleClass += 'bg-red-100 text-red-800 rounded-tr-none border border-red-300';
        } else {
            bubbleClass += 'bg-gray-200 text-gray-800 rounded-tr-none';
        }
    }

    bubble.className = bubbleClass;
    bubble.textContent = content; // XSS Protection

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapper;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Append user message
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    userInput.value = '';
    userInput.style.height = 'auto'; // Reset textarea height
    sendBtn.disabled = true;

    // Append loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-start mb-4';
    loadingWrapper.id = loadingId;
    loadingWrapper.innerHTML = '<div class="bg-gray-100 text-gray-500 p-3 rounded-lg rounded-tr-none max-w-xs shadow animate-pulse">جاري التفكير...</div>';
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

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
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        // Remove loading indicator
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        appendMessage('assistant', `فشل الاتصال بالخادم: ${error.message}`, true);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.scrollHeight > 150) {
        this.style.overflowY = 'auto';
    } else {
        this.style.overflowY = 'hidden';
    }
});
