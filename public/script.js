const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg shadow-sm max-w-[80%] whitespace-pre-wrap ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-tl-none'
            : isError
                ? 'bg-red-100 text-red-800 border border-red-200 rounded-tr-none'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tr-none'
    }`;

    // Securely set content using textContent to prevent XSS
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapperDiv;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button while processing
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-start mb-4';
    loadingWrapper.innerHTML = '<div class="bg-gray-200 text-gray-600 p-3 rounded-lg rounded-tr-none shadow-sm text-sm animate-pulse">جاري التفكير...</div>';
    chatContainer.appendChild(loadingWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading indicator
        chatContainer.removeChild(loadingWrapper);

        if (!response.ok) {
            // Handle error response from server
            const errorMessage = data.error?.message || 'حدث خطأ غير معروف.';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
        } else {
            // Handle success
            const assistantMessage = data.choices?.[0]?.message?.content || 'لا يوجد رد.';
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        }

    } catch (error) {
        // Remove loading indicator
        chatContainer.removeChild(loadingWrapper);
        console.error('Error:', error);
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});