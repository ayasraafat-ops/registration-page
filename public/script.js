const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    const baseClasses = 'p-4 rounded-lg shadow-sm max-w-[80%] whitespace-pre-wrap';

    if (role === 'user') {
        messageBubble.className = `${baseClasses} bg-blue-500 text-white rounded-tl-none`;
    } else {
        if (isError) {
            messageBubble.className = `${baseClasses} bg-red-100 text-red-700 rounded-tr-none border border-red-300`;
        } else {
            messageBubble.className = `${baseClasses} bg-white text-gray-800 rounded-tr-none`;
        }
    }

    messageBubble.textContent = content;
    wrapper.appendChild(messageBubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start';
    wrapper.innerHTML = `
        <div class="bg-gray-200 text-gray-500 p-4 rounded-lg rounded-tr-none shadow-sm flex items-center gap-2">
            <span class="animate-pulse">جاري التفكير...</span>
        </div>
    `;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Append user message
    appendMessage('user', text);

    // Add to history
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
        removeLoading();

        if (!response.ok) {
            const errorMsg = data.error?.message || 'حدث خطأ غير معروف.';
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
            // Optionally remove the failed user message from history
            conversationHistory.pop();
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }
    } catch (error) {
        removeLoading();
        appendMessage('assistant', `فشل الاتصال بالخادم: ${error.message}`, true);
        conversationHistory.pop();
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', handleSend);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        handleSend();
    }
});
