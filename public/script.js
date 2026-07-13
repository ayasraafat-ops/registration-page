const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, text) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('flex');

    const messageBox = document.createElement('div');
    messageBox.classList.add('p-3', 'rounded-lg', 'max-w-[80%]', 'shadow-sm');

    const textElement = document.createElement('p');
    textElement.classList.add('message-content');
    textElement.textContent = text; // XSS protection

    if (role === 'user') {
        // User message: align right, blue background
        messageContainer.classList.add('justify-start'); // RTL flex: justify-start is right
        messageBox.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tl-none');
    } else if (role === 'assistant') {
        // Assistant message: align left, gray background
        messageContainer.classList.add('justify-end'); // RTL flex: justify-end is left
        messageBox.classList.add('bg-gray-100', 'text-gray-800', 'rounded-tr-none');
    } else if (role === 'error') {
        // Error message
        messageContainer.classList.add('justify-end');
        messageBox.classList.add('bg-red-100', 'text-red-800', 'rounded-tr-none');
    }

    messageBox.appendChild(textElement);
    messageContainer.appendChild(messageBox);
    chatBox.appendChild(messageContainer);

    chatBox.scrollTop = chatBox.scrollHeight;
    return messageContainer;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });
    userInput.value = '';
    sendButton.disabled = true;

    // Add loading indicator
    const loadingMessage = appendMessage('assistant', 'جاري الكتابة...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading indicator
        loadingMessage.remove();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Network response was not ok');
        }

        const assistantReply = data.choices[0].message.content;
        appendMessage('assistant', assistantReply);
        conversationHistory.push({ role: 'assistant', content: assistantReply });

    } catch (error) {
        loadingMessage.remove();
        appendMessage('error', 'حدث خطأ: ' + error.message);
        console.error('Error:', error);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
});
