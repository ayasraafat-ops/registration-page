const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-lg shadow max-w-[80%] whitespace-pre-wrap ${role === 'user' ? 'bg-blue-600 text-white rounded-tl-none' : (isError ? 'bg-red-100 text-red-800 rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tr-none')}`;
    bubble.textContent = content;

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start mb-4';

    const bubble = document.createElement('div');
    bubble.className = 'p-3 rounded-lg shadow max-w-[80%] bg-gray-200 text-gray-800 rounded-tr-none';
    bubble.textContent = 'جاري التفكير...';

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function handleSend() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    userInput.value = '';
    sendButton.disabled = true;

    conversationHistory.push({ role: 'user', content: message });
    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        hideLoading();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير متوقع');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage('assistant', aiMessage);
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        hideLoading();
        appendMessage('assistant', `خطأ: ${error.message}`, true);
        // Remove the user message from history so they can try again if they want
        conversationHistory.pop();
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', handleSend);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            handleSend();
        }
    }
});
