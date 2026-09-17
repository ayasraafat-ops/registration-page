const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');

    // Base classes
    messageDiv.className = `max-w-[75%] rounded-2xl p-4 shadow-sm ${role === 'user' ? 'bg-blue-600 text-white rounded-tl-none' : 'bg-gray-200 text-gray-800 rounded-tr-none'}`;

    if (isError) {
        messageDiv.className = 'max-w-[75%] rounded-2xl p-4 shadow-sm bg-red-100 text-red-700 rounded-tr-none border border-red-300';
    }

    const textEl = document.createElement('p');
    textEl.className = 'whitespace-pre-wrap break-words';
    textEl.textContent = content; // XSS protection

    messageDiv.appendChild(textEl);
    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Auto scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Add user message to UI
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start w-full';
    loadingWrapper.innerHTML = `
        <div class="max-w-[75%] rounded-2xl p-4 bg-gray-200 text-gray-500 rounded-tr-none shadow-sm flex space-x-2 rtl:space-x-reverse items-center">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
    `;
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
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else if (data.choices && data.choices.length > 0) {
            const aiText = data.choices[0].message.content;
            appendMessage('assistant', aiText);
            conversationHistory.push({ role: 'assistant', content: aiText });
        } else {
            appendMessage('assistant', 'لم يتم استلام رد.', true);
        }

    } catch (error) {
        // Remove loading indicator
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled) {
        sendMessage();
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        sendMessage();
    }
});
