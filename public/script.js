const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const submitButton = chatForm.querySelector('button[type="submit"]');

let conversationHistory = [];

function appendMessage(role, text) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex mb-4 ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `max-w-[75%] p-4 rounded-lg shadow ${
        role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
    }`;

    messageBox.style.whiteSpace = 'pre-wrap';
    // XSS protection
    messageBox.textContent = text;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = messageInput.value.trim();
    if (!userText) return;

    // Add user message to UI
    appendMessage('user', userText);
    messageInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: userText });

    // Disable input while fetching
    messageInput.disabled = true;
    submitButton.disabled = true;

    // Create a temporary loading message
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex mb-4 justify-end';
    const loadingBox = document.createElement('div');
    loadingBox.className = 'max-w-[75%] p-4 rounded-lg shadow bg-gray-200 text-gray-500 rounded-tl-none italic';
    loadingBox.textContent = 'جاري الكتابة...';
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

        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'حدث خطأ أثناء الاتصال بالخادم.');
        }

        const aiText = data.choices[0].message.content;

        // Add AI message to UI
        appendMessage('assistant', aiText);

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiText });

    } catch (error) {
        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', 'خطأ: ' + error.message);
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        submitButton.disabled = false;
        messageInput.focus();
    }
});
