const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Initial system/assistant context if needed, but we start empty on client side.
let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg max-w-[80%] shadow ${
        role === 'user' ? 'bg-blue-100 text-blue-900' :
        (isError ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-white text-gray-800')
    }`;

    // Prevent XSS by using textContent and CSS pre-wrap
    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });
    userInput.value = '';

    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.innerHTML = `<div class="bg-white text-gray-500 p-3 rounded-lg max-w-[80%] shadow italic">جاري الكتابة...</div>`;
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
        document.getElementById(loadingId)?.remove();

        if (!response.ok) {
            const errorMsg = data.error?.message || "حدث خطأ غير معروف";
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else {
            const aiMessage = data.choices[0]?.message?.content || "عذراً، لم أتمكن من توليد رد.";
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        document.getElementById(loadingId)?.remove();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
