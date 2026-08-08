const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    // For RTL layout: user justifies right, assistant justifies left
    wrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageDiv = document.createElement('div');

    let bgClass, textClass;
    if (isError) {
        bgClass = 'bg-red-200';
        textClass = 'text-red-900';
    } else if (role === 'user') {
        bgClass = 'bg-gray-200';
        textClass = 'text-gray-900';
    } else {
        bgClass = 'bg-blue-100';
        textClass = 'text-blue-900';
    }

    messageDiv.className = `${bgClass} ${textClass} rounded-lg p-3 max-w-[80%] whitespace-pre-wrap`;

    // Prevent XSS using textContent
    messageDiv.textContent = content;

    wrapper.appendChild(messageDiv);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageDiv;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Disable input and button while loading
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    appendMessage('user', userMessage);

    conversationHistory.push({ role: 'user', content: userMessage });

    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = `flex justify-end`;
    const loadingDiv = document.createElement('div');
    loadingDiv.className = `bg-gray-100 text-gray-500 rounded-lg p-3 max-w-[80%]`;
    loadingDiv.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingDiv);
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
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }

        if (!response.ok) {
            let errorMsg = 'حدث خطأ غير معروف';
            if (data && data.error && data.error.message) {
                errorMsg = data.error.message;
            }
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }
    } catch (error) {
        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
});
