const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-lg max-w-3xl ${
        role === 'user'
        ? 'bg-blue-600 text-white rounded-tl-none'
        : role === 'error'
        ? 'bg-red-100 text-red-800 rounded-tr-none'
        : 'bg-gray-200 text-gray-800 rounded-tr-none'
    }`;

    bubble.style.whiteSpace = 'pre-wrap';
    bubble.textContent = content;

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Disable input and button
    chatInput.value = '';
    chatInput.disabled = true;
    sendButton.disabled = true;

    // Show user message
    appendMessage('user', message);
    conversationHistory.push({ role: 'user', content: message });

    // Show loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.innerHTML = '<div class="bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none">جاري التفكير...</div>';
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading indicator
        document.getElementById('loading-indicator')?.remove();

        if (!response.ok) {
            appendMessage('error', `حدث خطأ: ${data.error || 'فشل في الاتصال بالخادم'}`);
            return;
        }

        const aiMessage = data.choices?.[0]?.message?.content || 'لا يوجد رد.';
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        document.getElementById('loading-indicator')?.remove();
        appendMessage('error', `حدث خطأ: ${error.message}`);
    } finally {
        // Re-enable input and button
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});
