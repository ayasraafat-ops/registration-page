const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageDiv = document.createElement('div');

    let baseClasses = 'p-3 rounded-lg max-w-xs md:max-w-md shadow whitespace-pre-wrap ';

    if (role === 'user') {
        messageDiv.className = baseClasses + 'bg-blue-600 text-white';
    } else if (isError) {
        messageDiv.className = baseClasses + 'bg-red-100 text-red-800 border border-red-300';
    } else {
        messageDiv.className = baseClasses + 'bg-gray-200 text-gray-800';
    }

    messageDiv.textContent = content; // XSS protection

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text) return;

    // Display user message
    appendMessage('user', text);
    userInput.value = '';

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show temporary loading indicator
    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'flex justify-end';
    loadingWrapper.id = 'loading-indicator';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-100 text-gray-500 p-3 rounded-lg max-w-xs shadow italic text-sm';
    loadingDiv.textContent = 'جاري الكتابة...';
    loadingWrapper.appendChild(loadingDiv);
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
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            const errorMsg = data.error || 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMsg}`, true);
        } else {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        }

    } catch (error) {
        // Remove loading indicator
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    }
});
