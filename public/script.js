const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [
    { role: "system", content: "أنت مساعد ذكي ومفيد تتحدث باللغة العربية بطلاقة." }
];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex', 'w-full');

    // In RTL layout (dir="rtl"):
    // "justify-start" aligns to the right side (user messages)
    // "justify-end" aligns to the left side (assistant messages)
    if (role === 'user') {
        wrapper.classList.add('justify-start');
    } else {
        wrapper.classList.add('justify-end');
    }

    const messageBox = document.createElement('div');
    messageBox.classList.add('max-w-[75%]', 'p-4', 'rounded-lg', 'message-content', 'shadow-sm');

    if (role === 'user') {
        messageBox.classList.add('bg-blue-600', 'text-white', 'rounded-tr-none');
    } else {
        if (isError) {
             messageBox.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-300', 'rounded-tl-none');
        } else {
             messageBox.classList.add('bg-white', 'text-gray-800', 'border', 'border-gray-200', 'rounded-tl-none');
        }
    }

    // Protect against XSS
    messageBox.textContent = content;

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);
    messageInput.value = '';
    messageInput.style.height = 'auto'; // Reset textarea height

    // Add to history
    conversationHistory.push({ role: "user", content: text });

    // Show loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = "loading-indicator";
    loadingWrapper.classList.add('flex', 'w-full', 'justify-end');
    const loadingBox = document.createElement('div');
    loadingBox.classList.add('bg-white', 'text-gray-500', 'p-4', 'rounded-lg', 'border', 'border-gray-200', 'rounded-tl-none', 'shadow-sm', 'text-sm', 'animate-pulse');
    loadingBox.textContent = "جاري التفكير...";
    loadingWrapper.appendChild(loadingBox);
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
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();

        if (response.ok && data.choices && data.choices.length > 0) {
            const reply = data.choices[0].message.content;
            appendMessage('assistant', reply);
            conversationHistory.push({ role: "assistant", content: reply });
        } else {
            const errorMsg = data.error && data.error.message ? data.error.message : "حدث خطأ غير معروف";
            appendMessage('assistant', "خطأ: " + errorMsg, true);
        }
    } catch (error) {
         // Remove loading indicator
         const indicator = document.getElementById('loading-indicator');
         if (indicator) indicator.remove();
         appendMessage('assistant', "فشل الاتصال بالخادم: " + error.message, true);
    }
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.scrollHeight > 150) {
         this.style.overflowY = 'auto';
    } else {
         this.style.overflowY = 'hidden';
    }
});

// Initial greeting
appendMessage('assistant', 'مرحباً! أنا المساعد الذكي. كيف يمكنني مساعدتك اليوم؟');
