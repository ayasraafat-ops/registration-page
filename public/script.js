let conversationHistory = [];

const chatContainer = document.getElementById('chat-container');
const userInputElement = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const errorToast = document.getElementById('error-toast');
const errorMessageSpan = document.getElementById('error-message');

function showError(message) {
    errorMessageSpan.textContent = message;
    errorToast.classList.remove('hidden');
    setTimeout(() => {
        errorToast.classList.add('hidden');
    }, 5000);
}

function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `max-w-[75%] p-4 rounded-lg shadow ${
        role === 'user'
            ? 'bg-blue-100 text-blue-900 rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
    }`;

    // XSS protection: using textContent and whitespace pre-wrap
    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

async function sendMessage() {
    const content = userInputElement.value.trim();
    if (!content) return;

    // Disable input while sending
    userInputElement.value = '';
    userInputElement.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = 'جاري الإرسال...';

    // Append user message to UI and history
    appendMessage('user', content);
    conversationHistory.push({ role: 'user', content: content });

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
            throw new Error(data.error?.message || 'حدث خطأ غير معروف في الخادم');
        }

        const aiMessageContent = data.choices[0]?.message?.content;

        if (aiMessageContent) {
            appendMessage('assistant', aiMessageContent);
            conversationHistory.push({ role: 'assistant', content: aiMessageContent });
        } else {
            throw new Error('لم يتم استلام رد صالح من الذكاء الاصطناعي.');
        }

    } catch (error) {
        showError(`خطأ: ${error.message}`);
        // Remove the last user message from history if the API failed, so they can retry
        conversationHistory.pop();
    } finally {
        // Re-enable input
        userInputElement.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = 'إرسال';
        userInputElement.focus();
    }
}
