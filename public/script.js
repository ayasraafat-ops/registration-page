const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const sendBtn = document.getElementById('send-btn');
const errorMessageDiv = document.getElementById('error-message');

let messageHistory = [];

function showError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
    setTimeout(() => {
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.textContent = '';
    }, 5000);
}

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `max-w-[75%] rounded-lg p-3 ${
        role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 shadow rounded-tl-none border border-gray-200'
    }`;

    // Use textContent with white-space: pre-wrap to prevent XSS and preserve formatting
    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.textContent = content;

    wrapper.appendChild(messageDiv);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // UI Updates
    appendMessage('user', message);
    userInput.value = '';
    sendBtn.disabled = true;
    errorMessageDiv.classList.add('hidden');

    messageHistory.push({ role: 'user', content: message });

    // Loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex w-full justify-end" id="loading-indicator"';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-white text-gray-500 shadow rounded-lg rounded-tl-none border border-gray-200 p-3 italic text-sm';
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
            body: JSON.stringify({ messages: messageHistory })
        });

        const data = await response.json();

        // Remove loading
        chatContainer.removeChild(loadingWrapper);

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير معروف');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        messageHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading if it fails
        if (document.contains(loadingWrapper)) {
            chatContainer.removeChild(loadingWrapper);
        }
        console.error("Chat Error:", error);
        showError(`خطأ: ${error.message}`);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
});
