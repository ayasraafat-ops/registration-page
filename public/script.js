const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Conversation history
let messages = [
    {
        role: "system",
        content: "أنت مساعد ذكي ومفيد تتحدث باللغة العربية. اسمك هو Qwen."
    }
];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');
    let classes = 'p-3 rounded-xl max-w-[80%] whitespace-pre-wrap ';

    if (role === 'user') {
        classes += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        if (isError) {
             classes += 'bg-red-100 text-red-800 border border-red-300 rounded-tr-none';
        } else {
             classes += 'bg-gray-200 text-gray-800 rounded-tr-none';
        }
    }

    messageBox.className = classes;
    // XSS Protection: use textContent instead of innerHTML
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageWrapper;
}

function showLoading() {
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.className = 'flex justify-start';

    const loadingBox = document.createElement('div');
    loadingBox.className = 'bg-gray-100 text-gray-500 p-3 rounded-xl rounded-tr-none italic';
    loadingBox.textContent = 'جاري الكتابة...';

    loadingWrapper.appendChild(loadingBox);
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    userInput.value = '';
    userInput.style.height = 'auto'; // Reset height
    sendButton.disabled = true;
    userInput.disabled = true;

    // Add user message to UI and history
    appendMessage('user', text);
    messages.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        hideLoading();

        if (!response.ok) {
            throw new Error(data.error?.message || "حدث خطأ غير معروف");
        }

        const aiResponse = data.choices[0].message.content;
        appendMessage('assistant', aiResponse);
        messages.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        hideLoading();
        console.error("Error:", error);
        appendMessage('assistant', `عذراً، حدث خطأ: ${error.message}`, true);
    } finally {
        // Re-enable input
        sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});