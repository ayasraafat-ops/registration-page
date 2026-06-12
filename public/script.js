const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const errorContainer = document.getElementById('error-container');
const errorMessageEl = document.getElementById('error-message');

let conversationHistory = [];

function showError(message) {
    errorMessageEl.textContent = message;
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex');

    const innerDiv = document.createElement('div');
    innerDiv.classList.add('px-4', 'py-2', 'max-w-[80%]', 'shadow-sm');

    const textP = document.createElement('p');
    textP.classList.add('message-content');

    // Setting textContent for XSS protection
    textP.textContent = content;

    if (role === 'user') {
        // User aligned to left in RTL (using justify-end)
        messageDiv.classList.add('justify-end');
        innerDiv.classList.add('bg-blue-600', 'text-white', 'rounded-2xl', 'rounded-tl-none');
    } else {
        // Assistant aligned to right in RTL (using justify-start)
        messageDiv.classList.add('justify-start');
        innerDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-2xl', 'rounded-tr-none');
    }

    innerDiv.appendChild(textP);
    messageDiv.appendChild(innerDiv);
    chatHistory.appendChild(messageDiv);

    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear input
    userInput.value = '';

    // Append and save user message
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Disable input while waiting
    userInput.disabled = true;
    sendButton.disabled = true;

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
            throw new Error(data.error?.message || 'فشل الاتصال بالخادم.');
        }

        const assistantMessage = data.choices[0].message.content;

        // Append and save assistant message
        appendMessage('assistant', assistantMessage);
        conversationHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        showError("حدث خطأ: " + error.message);
        console.error('Error:', error);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}
