const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [
    { role: 'system', content: 'أنت مساعد ذكاء اصطناعي مفيد ولطيف تجيب باللغة العربية.' }
];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading
    sendBtn.disabled = true;
    sendBtn.textContent = 'جاري المعالجة...';

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
            throw new Error(data.error || 'حدث خطأ أثناء التواصل مع الخادم.');
        }

        const aiMessage = data.choices[0].message.content;

        // Add AI message to history and UI
        conversationHistory.push({ role: 'assistant', content: aiMessage });
        appendMessage('assistant', aiMessage);

    } catch (error) {
        console.error('Error:', error);
        appendMessage('error', `عذراً، حدث خطأ: ${error.message}`);
        // Remove the user message from history if the request failed
        conversationHistory.pop();
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'إرسال';
    }
});

function appendMessage(role, content) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex w-full';

    const messageBox = document.createElement('div');
    messageBox.className = 'max-w-[80%] rounded-lg p-3 text-sm message-content shadow-sm';

    if (role === 'user') {
        messageWrapper.classList.add('justify-end'); // Left in RTL
        messageBox.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else if (role === 'assistant') {
        messageWrapper.classList.add('justify-start'); // Right in RTL
        messageBox.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    } else { // Error
        messageWrapper.classList.add('justify-center');
        messageBox.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-400');
    }

    // Set textContent to prevent XSS
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
