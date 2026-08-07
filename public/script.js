const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');
const errorContainer = document.getElementById('error-container');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    // Using specified classes for role-based coloring
    const bgClass = role === 'user' ? 'bg-blue-100 text-blue-900 border-blue-200' : 'bg-gray-200 text-gray-900 border-gray-300';
    messageBox.className = `max-w-[75%] p-3 rounded-lg border ${bgClass}`;

    // XSS protection using textContent and whitespace handling
    messageBox.style.whiteSpace = 'pre-wrap';
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');

    const errorBox = document.createElement('div');
    errorBox.className = 'flex w-full justify-center my-2';
    const errorInner = document.createElement('div');
    errorInner.className = 'bg-red-200 text-red-900 p-2 rounded-lg text-sm';
    errorInner.textContent = message;
    errorBox.appendChild(errorInner);
    chatContainer.appendChild(errorBox);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function clearError() {
    errorContainer.textContent = '';
    errorContainer.classList.add('hidden');
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Clear input and show loading state
    userInput.value = '';
    sendButton.disabled = true;
    clearError();

    // Add temporary loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex w-full justify-end';
    loadingWrapper.innerHTML = '<div class="bg-gray-100 p-3 rounded-lg text-gray-500 animate-pulse">جاري التفكير...</div>';
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
        if(loadingEl) loadingEl.remove();

        if (!response.ok) {
            throw new Error((data.error && data.error.message) ? data.error.message : 'حدث خطأ في الاتصال بالخادم');
        }

        const aiText = data.choices[0].message.content;
        appendMessage('assistant', aiText);
        conversationHistory.push({ role: 'assistant', content: aiText });

    } catch (error) {
        // Remove loading indicator on error too
        const loadingEl = document.getElementById(loadingId);
        if(loadingEl) loadingEl.remove();

        console.error('Frontend Error:', error.message);
        showError(`خطأ: ${error.message}`);
        // Remove the failed user message from history so they can try again
        conversationHistory.pop();
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
});
