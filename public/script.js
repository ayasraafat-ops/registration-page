const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');

// Conversation history
let messages = [
    { role: "system", content: "أنت مساعد ذكاء اصطناعي مفيد. يجب أن تتحدث باللغة العربية." }
];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBox = document.createElement('div');
    // Using textContent and whitespace-pre-wrap to securely display content and prevent XSS
    messageBox.textContent = content;

    if (role === 'user') {
        messageBox.className = 'bg-blue-600 text-white rounded-lg p-3 max-w-[80%] whitespace-pre-wrap';
    } else if (role === 'error') {
        messageBox.className = 'bg-red-200 text-red-800 rounded-lg p-3 max-w-[80%] whitespace-pre-wrap';
    } else {
        messageBox.className = 'bg-gray-200 text-gray-800 rounded-lg p-3 max-w-[80%] whitespace-pre-wrap';
    }

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const messageBox = document.createElement('div');
    messageBox.textContent = 'جاري التفكير...';
    messageBox.className = 'bg-gray-100 text-gray-500 rounded-lg p-3 max-w-[80%] italic';

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text) return;

    // Append user message
    appendMessage('user', text);
    messages.push({ role: 'user', content: text });
    userInput.value = '';

    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;

    appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            // Display specific error details
            const errorMessage = data.error?.message || "حدث خطأ غير معروف في السيرفر.";
            appendMessage('error', `خطأ: ${errorMessage}`);
            return;
        }

        const aiContent = data.choices[0]?.message?.content || "لم يتم استلام أي رد.";
        appendMessage('assistant', aiContent);
        messages.push({ role: 'assistant', content: aiContent });

    } catch (error) {
        removeLoading();
        console.error('Fetch error:', error);
        appendMessage('error', `تعذر الاتصال بالسيرفر. التفاصيل: ${error.message}`);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
});
