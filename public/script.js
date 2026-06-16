const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const errorContainer = document.getElementById('error-message');

// Maintain chat history state
let chatHistory = [];

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
        errorContainer.textContent = '';
    }, 5000);
}

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex', role === 'user' ? 'justify-end' : 'justify-start');

    const messageBox = document.createElement('div');
    messageBox.classList.add('rounded-lg', 'py-2', 'px-4', 'max-w-3xl', 'whitespace-pre-wrap');

    if (role === 'user') {
        messageBox.classList.add('bg-indigo-600', 'text-white');
    } else {
        messageBox.classList.add('bg-gray-200', 'text-gray-800');
    }

    // Set textContent to prevent XSS vulnerabilities
    messageBox.textContent = content;

    wrapper.appendChild(messageBox);
    messagesContainer.appendChild(wrapper);

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add to UI
    appendMessage('user', text);
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Add to history
    chatHistory.push({ role: 'user', content: text });

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details || data.error || 'حدث خطأ غير معروف');
        }

        const assistantMessage = data.choices?.[0]?.message?.content;
        if (assistantMessage) {
            appendMessage('assistant', assistantMessage);
            chatHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            throw new Error('لم يتم استلام رد صالح من الخادم.');
        }

    } catch (error) {
        console.error('Error:', error);
        showError(`حدث خطأ أثناء الاتصال بالخادم: ${error.message}`);
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
