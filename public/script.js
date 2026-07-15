const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let messages = [
    { role: 'system', content: 'أنت مساعد ذكي ومفيد. أجب باللغة العربية.' }
];

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex ' + (role === 'user' ? 'justify-start' : 'justify-end');

    const messageBox = document.createElement('div');
    messageBox.className = 'p-3 rounded-xl max-w-[80%] whitespace-pre-wrap ' +
        (role === 'user' ? 'bg-blue-600 text-white' : (role === 'error' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'));

    // Prevent XSS
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageBox; // return in case we need to update it (like a loading state)
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Display user message
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    messages.push({ role: 'user', content: text });

    // Loading indicator
    const loadingMessage = appendMessage('assistant', 'جاري الكتابة...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();

        // Remove loading message
        loadingMessage.parentElement.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير معروف');
        }

        const aiResponse = data.choices[0].message.content;

        // Display AI message
        appendMessage('assistant', aiResponse);

        // Add to history
        messages.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        // Remove loading message if error occurs
        if (loadingMessage.parentElement) {
            loadingMessage.parentElement.remove();
        }
        appendMessage('error', 'خطأ: ' + error.message);
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
