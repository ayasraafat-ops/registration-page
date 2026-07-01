const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex';

    // User messages align right (justify-start in RTL), AI messages align left (justify-end in RTL)
    if (role === 'user') {
        messageDiv.classList.add('justify-start');
    } else {
        messageDiv.classList.add('justify-end');
    }

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `rounded-lg p-3 max-w-[80%] whitespace-pre-wrap ${role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`;
    bubbleDiv.textContent = content; // Prevents XSS

    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageDiv;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Add to UI
    appendMessage('user', userMessage);

    // Add to history
    conversationHistory.push({ role: 'user', content: userMessage });

    // Clear input
    messageInput.value = '';
    messageInput.disabled = true;

    // Show loading indicator
    const loadingMessageDiv = appendMessage('assistant', 'جاري الكتابة...');
    loadingMessageDiv.id = 'loading-indicator';

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
        loadingMessageDiv.remove();

        if (response.ok && data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            appendMessage('assistant', aiMessage);
            conversationHistory.push({ role: 'assistant', content: aiMessage });
        } else {
            const errorMsg = data.error || 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMsg}`);
            console.error("API Error:", data);
        }
    } catch (error) {
        // Remove loading indicator
        if (document.getElementById('loading-indicator')) {
            document.getElementById('loading-indicator').remove();
        }
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`);
        console.error("Network Error:", error);
    } finally {
        messageInput.disabled = false;
        messageInput.focus();
    }
});
