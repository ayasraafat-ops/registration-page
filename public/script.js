const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let messages = [
    { role: 'system', content: 'أنت مساعد ذكاء اصطناعي مفيد. أجب باللغة العربية.' }
];

function appendMessage(role, text, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-lg max-w-[80%] whitespace-pre-wrap `;

    if (role === 'user') {
        bubble.className += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        bubble.className += isError ? 'bg-red-100 text-red-800 rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tr-none';
    }

    bubble.textContent = text;
    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendButton.disabled) return;

    // Disable input
    userInput.value = '';
    sendButton.disabled = true;
    userInput.disabled = true;

    // Add user message to UI and history
    appendMessage('user', text);
    messages.push({ role: 'user', content: text });

    // Show loading
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-start mb-4 loading-indicator';
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tr-none';
    loadingBubble.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingBubble);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();

        // Remove loading
        chatContainer.removeChild(loadingWrapper);

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'حدث خطأ غير معروف');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        messages.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        if(chatContainer.contains(loadingWrapper)) {
            chatContainer.removeChild(loadingWrapper);
        }
        appendMessage('assistant', `خطأ: ${error.message}`, true);
        // Remove the failed user message from history so it can be retried
        messages.pop();
    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
