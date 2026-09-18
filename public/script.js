const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');

    // User messages to the right, Assistant to the left in RTL
    if (role === 'user') {
        wrapperDiv.className = 'flex justify-end mb-4';
    } else {
        wrapperDiv.className = 'flex justify-start mb-4';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap shadow-sm ${isError ? 'bg-red-100 text-red-800 border border-red-300' : ''}`;

    if (!isError) {
        if (role === 'user') {
            messageDiv.classList.add('bg-indigo-100', 'text-indigo-900', 'rounded-tl-none');
        } else {
            messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
        }
    }

    // Using textContent prevents XSS
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapperDiv;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button while loading
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Append user message
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-start mb-4 loading-indicator';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none max-w-[80%] shadow-sm';
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
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading indicator
        loadingWrapper.remove();

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'حدث خطأ غير معروف.');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        // Remove loading indicator if still there
        if (chatContainer.contains(loadingWrapper)) {
            loadingWrapper.remove();
        }
        appendMessage('assistant', `خطأ: ${error.message}`, true);
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        sendMessage();
    }
});
