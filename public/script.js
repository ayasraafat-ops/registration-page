const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

// Store conversation history
let conversationHistory = [];

// Helper function to append messages safely
function appendMessage(role, text) {
    const isUser = role === 'user';
    const alignClass = isUser ? 'justify-end' : 'justify-start';
    const bgClass = isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800';

    // Create container
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${alignClass} w-full`;

    // Create message bubble
    const bubble = document.createElement('div');
    bubble.className = `${bgClass} rounded-lg p-3 max-w-[80%] shadow-sm`;
    bubble.style.whiteSpace = 'pre-wrap';

    // Setting textContent directly to avoid XSS
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return bubble;
}

// Helper to show/remove loading indicator
function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex justify-start w-full';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-500 rounded-lg p-3 max-w-[80%] shadow-sm italic';
    bubble.textContent = 'جاري الكتابة...';

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();
    if (!text) return;

    // Clear input
    messageInput.value = '';

    // Append user message to UI
    appendMessage('user', text);

    // Update conversation history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
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

        if (response.ok && data.choices && data.choices.length > 0) {
            const botMessage = data.choices[0].message.content;

            // Append bot message to UI
            appendMessage('assistant', botMessage);

            // Update history
            conversationHistory.push({ role: 'assistant', content: botMessage });
        } else {
            console.error('Error from server:', data);
            appendMessage('assistant', 'عذراً، حدث خطأ أثناء الاتصال بالخادم.');
        }

    } catch (error) {
        console.error('Fetch error:', error);
        removeLoading();
        appendMessage('assistant', 'عذراً، حدث خطأ في الشبكة.');
    }
});
