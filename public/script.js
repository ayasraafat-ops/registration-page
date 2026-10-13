const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history for context
let conversationHistory = [];

function appendMessage(role, text, isError = false) {
    const wrapper = document.createElement('div');
    const isUser = role === 'user';

    // In RTL: user on left (justify-end since it flips), assistant on right (justify-start)
    wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');

    // Base classes
    let bubbleClasses = 'p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg shadow whitespace-pre-wrap ';

    if (isUser) {
        bubbleClasses += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        if (isError) {
            bubbleClasses += 'bg-red-100 text-red-700 border border-red-300 rounded-tr-none';
        } else {
            bubbleClasses += 'bg-gray-200 text-gray-800 rounded-tr-none';
        }
    }

    messageBubble.className = bubbleClasses;

    // Prevent XSS
    messageBubble.textContent = text;

    wrapper.appendChild(messageBubble);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none max-w-xs flex space-x-2 space-x-reverse items-center shadow';

    const dot1 = document.createElement('div');
    dot1.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
    const dot2 = document.createElement('div');
    dot2.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
    dot2.style.animationDelay = '0.2s';
    const dot3 = document.createElement('div');
    dot3.className = 'w-2 h-2 bg-gray-500 rounded-full animate-bounce';
    dot3.style.animationDelay = '0.4s';

    bubble.appendChild(dot1);
    bubble.appendChild(dot2);
    bubble.appendChild(dot3);

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
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

    // Disable input while processing
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Append user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

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
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const reply = data.choices[0].message.content;
            appendMessage('assistant', reply);
            conversationHistory.push({ role: 'assistant', content: reply });
        } else {
            appendMessage('assistant', 'عذراً، لم أتمكن من فهم الاستجابة.', true);
        }

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
