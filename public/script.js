const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add('flex');

    // In RTL, user is right (justify-start in row-reverse context or just let default, but let's be explicit)
    // Actually, in dir="rtl", flex row starts from right.
    // So 'justify-start' will align to the right.
    // 'justify-end' will align to the left.
    if (role === 'user') {
        wrapperDiv.classList.add('justify-start');
    } else {
        wrapperDiv.classList.add('justify-end');
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('p-3', 'rounded-lg', 'max-w-[80%]', 'shadow');

    if (role === 'user') {
        messageDiv.classList.add('bg-blue-600', 'text-white');
    } else {
        messageDiv.classList.add('bg-gray-200', 'text-gray-800');
    }

    if (isError) {
        messageDiv.classList.replace('bg-gray-200', 'bg-red-100');
        messageDiv.classList.replace('text-gray-800', 'text-red-800');
    }

    const paragraph = document.createElement('p');
    paragraph.classList.add('message-content');
    // Using textContent for XSS protection
    paragraph.textContent = content;

    messageDiv.appendChild(paragraph);
    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Display user message
    appendMessage('user', message);
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Add to history
    conversationHistory.push({ role: 'user', content: message });

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
            throw new Error(data.error ? data.error.message : 'حدث خطأ غير معروف');
        }

        const aiResponse = data.choices[0].message.content;
        appendMessage('assistant', aiResponse);
        conversationHistory.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        console.error('Error:', error);
        appendMessage('assistant', `عذراً، حدث خطأ: ${error.message}`, true);
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
});