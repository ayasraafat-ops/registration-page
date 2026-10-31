const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendButton = document.getElementById('send-button');

// Conversation history
let conversation = [];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sendButton.disabled) return;
    await sendMessage();
});

userInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!sendButton.disabled) {
            await sendMessage();
        }
    }
});

function appendMessage(text, sender, isError = false) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    // Using textContent prevents XSS
    messageBubble.textContent = text;

    // RTL tailwind styling: user (right align in code, visually left in RTL)
    // assistant (left align in code, visually right in RTL)
    const baseClasses = 'p-3 rounded-2xl max-w-[80%] whitespace-pre-wrap';

    if (isError) {
        messageBubble.className = `${baseClasses} bg-red-100 text-red-800 rounded-tr-none`;
    } else if (sender === 'user') {
        messageBubble.className = `${baseClasses} bg-blue-600 text-white rounded-tl-none`;
    } else {
        messageBubble.className = `${baseClasses} bg-gray-200 text-gray-800 rounded-tr-none`;
    }

    messageContainer.appendChild(messageBubble);
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendLoading() {
    const container = document.createElement('div');
    container.className = 'flex justify-start loading-indicator';
    container.id = 'loading-indicator';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-2xl rounded-tr-none flex space-x-1 space-x-reverse';

    // Three bouncing dots
    for(let i=0; i<3; i++) {
        const dot = document.createElement('div');
        dot.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
        if (i === 1) dot.style.animationDelay = '0.2s';
        if (i === 2) dot.style.animationDelay = '0.4s';
        bubble.appendChild(dot);
    }

    container.appendChild(bubble);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button
    userInput.disabled = true;
    sendButton.disabled = true;
    userInput.value = '';

    // Add user message to UI and history
    appendMessage(text, 'user');
    conversation.push({ role: 'user', content: text });

    appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversation })
        });

        const data = await response.json();
        removeLoading();

        if (response.ok && data.choices && data.choices.length > 0) {
            const aiText = data.choices[0].message.content;
            appendMessage(aiText, 'assistant');
            conversation.push({ role: 'assistant', content: aiText });
        } else {
            const errorMsg = (data.error && data.error.message) ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage(`خطأ: ${errorMsg}`, 'assistant', true);
        }

    } catch (error) {
        removeLoading();
        appendMessage(`خطأ في الاتصال: ${error.message}`, 'assistant', true);
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}
