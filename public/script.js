let conversationHistory = [];

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    // Common styles
    let bubbleClasses = 'p-3 rounded-lg shadow-sm max-w-[80%] whitespace-pre-wrap ';

    if (role === 'user') {
        bubbleClasses += 'bg-blue-500 text-white rounded-tl-none';
    } else if (role === 'error') {
        bubbleClasses += 'bg-red-100 text-red-700 rounded-tr-none border border-red-300';
    } else {
        bubbleClasses += 'bg-gray-200 text-gray-800 rounded-tr-none';
    }

    messageBubble.className = bubbleClasses;
    messageBubble.textContent = content; // XSS protection

    wrapper.appendChild(messageBubble);
    chatContainer.appendChild(wrapper);

    // Auto-scroll
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const loader = document.createElement('div');
    loader.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none shadow-sm flex gap-1 items-center';

    // Simple dot animation
    loader.innerHTML = '<span class="animate-bounce">.</span><span class="animate-bounce delay-75">.</span><span class="animate-bounce delay-150">.</span>';

    wrapper.appendChild(loader);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Clear input and disable button
    userInput.value = '';
    sendBtn.disabled = true;

    appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ في الاتصال بالخادم.');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        removeLoading();
        appendMessage('error', `عذراً، حدث خطأ: ${error.message}`);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        sendMessage();
    }
});