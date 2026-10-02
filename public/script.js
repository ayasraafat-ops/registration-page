const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let conversationHistory = [];

function appendMessage(text, isUser = false, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');

    // Base classes
    messageDiv.className = `p-3 max-w-[80%] rounded-lg whitespace-pre-wrap ${
        isUser
            ? 'bg-blue-600 text-white rounded-tl-none'
            : isError
                ? 'bg-red-100 text-red-800 rounded-tr-none'
                : 'bg-gray-200 text-gray-800 rounded-tr-none'
    }`;

    // Prevent XSS
    messageDiv.textContent = text;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapperDiv; // return so we can remove loading indicator
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage(text, true);

    // Add user message to history
    conversationHistory.push({ role: 'user', content: text });

    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Show loading indicator
    const loadingWrapper = appendMessage('...', false);

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
        chatContainer.removeChild(loadingWrapper);

        if (!response.ok) {
            const errorMsg = data.error?.message || 'حدث خطأ غير معروف.';
            appendMessage(`خطأ: ${errorMsg}`, false, true);
            return;
        }

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const aiMessage = data.choices[0].message.content;
            appendMessage(aiMessage, false);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            appendMessage('لم يتم استلام استجابة صالحة من الخادم.', false, true);
        }

    } catch (error) {
        chatContainer.removeChild(loadingWrapper);
        appendMessage(`خطأ في الاتصال: ${error.message}`, false, true);
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
