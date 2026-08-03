let messages = [
    { role: "system", content: "أنت مساعد ذكاء اصطناعي مفيد وتتحدث باللغة العربية." }
];

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function appendMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex ' + (role === 'user' ? 'justify-start' : 'justify-end');

    const innerDiv = document.createElement('div');
    innerDiv.className = 'max-w-[75%] rounded-lg px-4 py-2 message-content ';

    if (role === 'user') {
        innerDiv.className += 'bg-blue-600 text-white';
    } else if (role === 'error') {
        innerDiv.className += 'bg-red-200 text-red-900 border border-red-300';
    } else {
        innerDiv.className += 'bg-gray-200 text-gray-900';
    }

    innerDiv.textContent = text;
    messageDiv.appendChild(innerDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    appendMessage('user', text);
    messages.push({ role: 'user', content: text });

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.className = 'flex justify-end text-gray-500 text-sm';
    loadingDiv.textContent = 'جاري الكتابة...';
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        document.getElementById('loading').remove();

        const data = await response.json();

        if (response.ok) {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
            messages.push({ role: 'assistant', content: assistantMessage });
        } else {
            const errorText = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('error', 'عذراً، حدث خطأ: ' + errorText);
            messages.pop(); // Remove the last user message on error to allow retry
        }
    } catch (error) {
        document.getElementById('loading').remove();
        appendMessage('error', 'عذراً، حدث خطأ في الاتصال الخادم.');
        messages.pop();
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
