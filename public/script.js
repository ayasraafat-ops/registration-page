const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full flex';

    // In RTL, justify-start aligns to the right (user), justify-end aligns to the left (assistant)
    if (role === 'user') {
        wrapper.classList.add('justify-start');
    } else {
        wrapper.classList.add('justify-end');
    }

    const messageBox = document.createElement('div');
    messageBox.className = 'px-4 py-3 max-w-[80%] rounded-2xl whitespace-pre-wrap';

    if (role === 'user') {
        messageBox.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tl-none');
    } else {
        // AI or Error
        if (role === 'error') {
            messageBox.classList.add('bg-red-200', 'text-red-900', 'rounded-tr-none');
        } else {
            messageBox.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tr-none');
        }
    }

    messageBox.textContent = content; // XSS protection

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageBox;
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // Display user message
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading
    const loadingMessage = appendMessage('assistant', 'جاري التفكير...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading message
        loadingMessage.parentElement.remove();

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'حدث خطأ غير معروف');
        }

        const aiResponse = data.choices[0].message.content;
        appendMessage('assistant', aiResponse);

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        // Remove loading message if still there
        if (loadingMessage.parentElement) {
            loadingMessage.parentElement.remove();
        }
        appendMessage('error', 'حدث خطأ: ' + error.message);
    }
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});
