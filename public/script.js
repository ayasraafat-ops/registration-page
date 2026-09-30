const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');
    // Using white-space: pre-wrap for text formatting and textContent for XSS protection
    messageDiv.style.whiteSpace = 'pre-wrap';

    let baseClasses = 'p-3 rounded-lg max-w-[80%] ';

    if (isError) {
        baseClasses += 'bg-red-100 text-red-800 border border-red-300';
    } else if (role === 'user') {
        baseClasses += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        baseClasses += 'bg-gray-200 text-gray-800 rounded-tr-none';
    }

    messageDiv.className = baseClasses;
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Disable input while processing
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    appendMessage('user', text);

    const userMessage = { role: 'user', content: text };
    conversationHistory.push(userMessage);

    // Show loading state
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.innerHTML = `
        <div class="bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none max-w-[80%] italic">
            جاري الكتابة...
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

        // Remove loading state
        document.getElementById(loadingId)?.remove();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير معروف');
        }

        if (data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message;
            appendMessage('assistant', aiMessage.content);
            conversationHistory.push(aiMessage);
        } else {
            throw new Error('لم يتم استلام رد صحيح من الخادم');
        }

    } catch (error) {
        document.getElementById(loadingId)?.remove();
        appendMessage('system', `عذراً، حدث خطأ: ${error.message}`, true);
        // Remove the failed user message from history so they can try again
        conversationHistory.pop();
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
