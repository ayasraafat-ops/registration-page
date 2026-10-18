const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    let bubbleClasses = 'p-3 shadow max-w-[80%] whitespace-pre-wrap ';

    if (role === 'user') {
        bubbleClasses += 'bg-blue-500 text-white rounded-lg rounded-tl-none';
    } else {
        if (isError) {
            bubbleClasses += 'bg-red-100 text-red-700 rounded-lg rounded-tr-none border border-red-300';
        } else {
            bubbleClasses += 'bg-white text-gray-800 rounded-lg rounded-tr-none';
        }
    }

    messageBubble.className = bubbleClasses;
    // Use textContent to prevent XSS
    messageBubble.textContent = content;

    messageWrapper.appendChild(messageBubble);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.className = 'flex justify-start mb-4';

    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none shadow max-w-[80%] flex items-center space-x-2 space-x-reverse';
    loadingBubble.innerHTML = `
        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
    `;

    loadingWrapper.appendChild(loadingBubble);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button while processing
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            const errorMsg = data.error || 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else if (data.choices && data.choices.length > 0) {
            const aiReply = data.choices[0].message.content;
            appendMessage('assistant', aiReply);
            conversationHistory.push({ role: 'assistant', content: aiReply });
        } else {
            appendMessage('assistant', 'لم يتم استلام استجابة صالحة من الخادم.', true);
        }
    } catch (error) {
        removeLoading();
        appendMessage('assistant', `تعذر الاتصال بالخادم: ${error.message}`, true);
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', handleSend);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        handleSend();
    }
});
