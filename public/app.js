const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-4 flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const innerDiv = document.createElement('div');
    innerDiv.className = `p-3 rounded-lg shadow max-w-[80%] message-content ${
        role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'
    }`;

    // Safely add text content to prevent XSS
    innerDiv.textContent = content;

    messageDiv.appendChild(innerDiv);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear input
    userInput.value = '';

    // Add user message to UI
    appendMessage('user', text);

    // Add user message to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'mb-4 flex justify-start text-gray-500';
    loadingDiv.id = 'loading-indicator';
    loadingDiv.textContent = 'جاري التفكير...';
    chatContainer.appendChild(loadingDiv);
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
        document.getElementById('loading-indicator').remove();

        if (response.ok && data.choices && data.choices.length > 0) {
            const botMessage = data.choices[0].message.content;

            // Add bot message to UI
            appendMessage('assistant', botMessage);

            // Add bot message to history
            conversationHistory.push({ role: 'assistant', content: botMessage });
        } else {
            console.error('Error from server:', data);
            appendMessage('assistant', 'عذراً، حدث خطأ أثناء معالجة طلبك.');
        }
    } catch (error) {
        console.error('Network error:', error);
        // Remove loading indicator
        document.getElementById('loading-indicator')?.remove();
        appendMessage('assistant', 'عذراً، حدث خطأ في الاتصال بالخادم.');
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
