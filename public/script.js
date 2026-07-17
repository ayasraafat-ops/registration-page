const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const messageBox = document.createElement('div');
    messageBox.className = 'p-3 rounded-lg max-w-[80%] md:max-w-[60%] whitespace-pre-wrap ';

    if (role === 'user') {
        messageBox.className += 'bg-blue-600 text-white';
    } else {
        if (isError) {
            messageBox.className += 'bg-red-200 text-red-900 border border-red-300';
        } else {
            messageBox.className += 'bg-gray-200 text-gray-800';
        }
    }

    messageBox.textContent = content; // Prevents XSS

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapper;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to UI
    appendMessage('user', message);
    messageInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: message });

    // Add loading indicator
    sendButton.disabled = true;
    sendButton.textContent = 'جاري الإرسال...';
    sendButton.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير متوقع';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }
    } catch (error) {
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = 'إرسال';
        sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});
