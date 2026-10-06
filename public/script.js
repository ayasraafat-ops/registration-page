const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [
    { role: "system", content: "أنت مساعد ذكي باللغة العربية." }
];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');

    let bubbleClasses = 'p-3 rounded-lg shadow max-w-md break-words ';
    if (role === 'user') {
        bubbleClasses += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        if (isError) {
             bubbleClasses += 'bg-red-100 text-red-800 rounded-tr-none border border-red-300 error-bubble';
        } else {
             bubbleClasses += 'bg-white text-gray-800 rounded-tr-none ai-response';
        }
    }

    messageBubble.className = bubbleClasses;

    // Use textContent to prevent XSS
    messageBubble.textContent = content;
    // Keep line breaks
    messageBubble.style.whiteSpace = 'pre-wrap';

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

async function submitMessage() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    // Add user message to UI
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Disable input while waiting
    sendBtn.disabled = true;
    userInput.disabled = true;

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start loading-indicator';
    loadingWrapper.innerHTML = `<div class="bg-gray-200 text-gray-600 p-3 rounded-lg rounded-tr-none shadow animate-pulse">جاري الكتابة...</div>`;
    chatContainer.appendChild(loadingWrapper);
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;

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
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            const errorMsg = (data.error && data.error.message) ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', `خطأ في الاتصال بالخادم: ${error.message}`, true);
    } finally {
        // Re-enable input
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', submitMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        submitMessage();
    }
});