const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');

    let bubbleClass = 'p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ';
    if (role === 'user') {
        bubbleClass += 'bg-blue-600 text-white rounded-tl-none';
    } else {
        if (isError) {
            bubbleClass += 'bg-red-100 text-red-800 border border-red-300 rounded-tr-none';
        } else {
            bubbleClass += 'bg-gray-200 text-gray-800 rounded-tr-none';
        }
    }

    bubble.className = bubbleClass;
    bubble.textContent = content;

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-600 p-3 rounded-lg rounded-tr-none max-w-[80%] italic';
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

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    // Disable input and button
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    appendMessage('user', text);

    conversationHistory.push({ role: 'user', content: text });

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
            const errorMessage = data.error?.message || 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }
    } catch (error) {
        hideLoading();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        // Re-enable input and button
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