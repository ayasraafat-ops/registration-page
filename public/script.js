const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const loadingIndicator = document.getElementById('loading');
const sendButton = document.getElementById('send-button');

let messages = [];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
        isError
            ? 'bg-red-50 text-red-700 border border-red-100'
            : role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
    }`;

    // Use textContent with white-space: pre-wrap to prevent XSS and preserve line breaks
    messageBox.style.whiteSpace = 'pre-wrap';
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Remove the initial greeting if it's still there
    const greeting = chatContainer.querySelector('.text-center.text-gray-400');
    if (greeting) {
        greeting.remove();
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        sendButton.disabled = true;
        userInput.disabled = true;
    } else {
        loadingIndicator.classList.add('hidden');
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = userInput.value.trim();
    if (!userText) return;

    // Add user message to UI
    appendMessage('user', userText);
    userInput.value = '';

    // Add to history
    messages.push({ role: 'user', content: userText });

    setLoading(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير متوقع');
        }

        const aiText = data.choices[0].message.content;
        appendMessage('assistant', aiText);
        messages.push({ role: 'assistant', content: aiText });

    } catch (error) {
        console.error('Error:', error);
        appendMessage('assistant', `عذراً، حدث خطأ: ${error.message}`, true);
        // Remove the last user message from history so they can try again
        messages.pop();
    } finally {
        setLoading(false);
    }
});