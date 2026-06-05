const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const errorContainer = document.getElementById('error-container');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `max-w-xs md:max-w-md p-3 rounded-lg shadow message-content ${role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`;

    // XSS protection: using textContent instead of innerHTML
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    errorContainer.textContent = `خطأ: ${message}`;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000);
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear input and hide error
    userInput.value = '';
    errorContainer.classList.add('hidden');

    // Disable input while processing
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error((data.error && data.error.message) ? data.error.message : 'حدث خطأ في الخادم');
        }

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            throw new Error('استجابة غير متوقعة من الخادم');
        }

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        // Remove the user message from history if the request failed
        conversationHistory.pop();
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Initial focus
userInput.focus();
