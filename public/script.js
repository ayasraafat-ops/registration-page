const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let chatHistory = [];

function appendMessage(role, text, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex w-full';

    // In RTL (Right-to-Left):
    // justify-end will push to the left (User)
    // justify-start will keep it to the right (Assistant)
    if (role === 'user') {
        wrapperDiv.classList.add('justify-end');
    } else {
        wrapperDiv.classList.add('justify-start');
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'p-3 rounded-lg shadow-sm border max-w-[80%] message-content';

    if (role === 'user') {
        messageDiv.classList.add('bg-blue-100', 'border-blue-200', 'text-blue-900');
    } else {
        messageDiv.classList.add('bg-white', 'border-gray-200', 'text-gray-800');
        if (isError) {
            messageDiv.classList.add('border-red-500', 'bg-red-50', 'text-red-700');
        }
    }

    // Use textContent for XSS protection
    messageDiv.textContent = text;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Append user message
    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    // Show loading state
    const loadingId = Date.now().toString();
    appendMessage('assistant', 'جاري التفكير...', false);
    const loadingElement = chatContainer.lastElementChild;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });

        const data = await response.json();

        // Remove loading element
        chatContainer.removeChild(loadingElement);

        if (!response.ok) {
            // Include specific technical error details
            const errorMessage = data.error?.message || `حدث خطأ غير متوقع. (رمز الخطأ: ${response.status})`;
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMessage}`, true);
        } else {
            const aiMessage = data.choices?.[0]?.message?.content || "لا يوجد رد.";
            appendMessage('assistant', aiMessage);
            chatHistory.push({ role: 'assistant', content: aiMessage });
        }
    } catch (error) {
        // Remove loading element
        if (chatContainer.lastElementChild === loadingElement) {
             chatContainer.removeChild(loadingElement);
        }

        appendMessage('assistant', `فشل الاتصال بالخادم: ${error.message}`, true);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
