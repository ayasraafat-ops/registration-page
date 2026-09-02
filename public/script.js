const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value.trim() === '') {
        this.style.height = '48px';
    }
});

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    // Align user to left (end in RTL), assistant to right (start in RTL)
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');

    if (role === 'user') {
        bubble.className = 'bg-blue-600 text-white rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] md:max-w-[75%] shadow-sm';
    } else {
        if (isError) {
            bubble.className = 'bg-red-100 text-red-800 rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] md:max-w-[75%] shadow-sm border border-red-200';
        } else {
            bubble.className = 'bg-slate-100 text-slate-800 rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] md:max-w-[75%] shadow-sm';
        }
    }

    const textEl = document.createElement('p');
    textEl.className = 'whitespace-pre-wrap';
    textEl.textContent = content; // XSS Protection

    bubble.appendChild(textEl);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return wrapper;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-slate-100 rounded-2xl rounded-tr-none px-4 py-4 shadow-sm flex space-x-2 rtl:space-x-reverse';

    for(let i=0; i<3; i++) {
        const dot = document.createElement('div');
        dot.className = 'w-2 h-2 bg-slate-400 rounded-full animate-bounce';
        dot.style.animationDelay = `${i * 0.15}s`;
        bubble.appendChild(dot);
    }

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    // Disable input while processing
    userInput.value = '';
    userInput.style.height = '48px';
    userInput.disabled = true;
    sendBtn.disabled = true;

    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    showLoading();

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

        if (response.ok && data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
        }

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `عذراً، تعذر الاتصال بالخادم: ${error.message}`, true);
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
