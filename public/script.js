const chatForm = document.getElementById('chat-form');
const userInputElement = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');

// Chat history for context
let conversationHistory = [];

// Helper to construct DOM using document.createElement for XSS protection
function appendMessage(text, role) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 max-w-[80%] rounded-xl shadow-sm whitespace-pre-wrap ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-tl-none'
            : role === 'error'
                ? 'bg-red-200 text-red-900 rounded-tr-none'
                : 'bg-white text-gray-800 rounded-tr-none'
    }`;

    // Crucial for XSS protection
    messageDiv.textContent = text;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapperDiv;
}

function showLoadingIndicator() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = 'loading-indicator';
    wrapperDiv.className = 'flex justify-start';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'bg-gray-200 text-gray-600 p-3 rounded-xl rounded-tr-none shadow-sm';
    messageDiv.textContent = 'جاري الكتابة...';

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapperDiv;
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = userInputElement.value.trim();
    if (!userText) return;

    // Display user message
    appendMessage(userText, 'user');

    // Add to history
    conversationHistory.push({ role: 'user', content: userText });

    // Clear input
    userInputElement.value = '';

    // Show loading
    showLoadingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        hideLoadingIndicator();

        if (!response.ok) {
            console.error('Server returned an error:', data.error);
            appendMessage(`حدث خطأ: ${data.error || 'خطأ غير معروف'}`, 'error');
            return;
        }

        if (data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage(aiMessage, 'assistant');
            // Add to history
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            appendMessage('لم يتم استلام استجابة صحيحة من الخادم.', 'error');
        }

    } catch (error) {
        console.error('Fetch error:', error);
        hideLoadingIndicator();
        appendMessage(`فشل الاتصال بالخادم: ${error.message}`, 'error');
    }
});
