let messages = [];

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    // Align user right, AI left in RTL context
    // In RTL, justify-start means right, justify-end means left
    wrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'} mb-4`;

    const messageBox = document.createElement('div');
    messageBox.className = `rounded-lg p-3 max-w-[80%] whitespace-pre-wrap ${
        role === 'user'
            ? 'bg-blue-600 text-white'
            : isError
                ? 'bg-red-200 text-red-800'
                : 'bg-gray-200 text-gray-800'
    }`;

    // Prevent XSS
    messageBox.textContent = content;

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-end mb-4';

    const messageBox = document.createElement('div');
    messageBox.className = 'bg-gray-200 text-gray-800 rounded-lg p-3 max-w-[80%]';
    messageBox.textContent = 'جاري التفكير...';

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

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Append user message to UI and history
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
        removeLoading();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير معروف');
        }

        const aiResponse = data.choices[0].message.content;
        appendMessage('assistant', aiResponse);
        messages.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `عذراً، حدث خطأ: ${error.message}`, true);
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
