let conversationHistory = [];

const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value === '') {
        this.style.height = 'auto'; // reset
    }
});

// Send on Enter (shift+enter for new line)
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex');

    // In RTL: user message goes to the right (justify-start), AI to the left (justify-end)
    if (role === 'user') {
        wrapper.classList.add('justify-start');
    } else {
        wrapper.classList.add('justify-end');
    }

    const messageBox = document.createElement('div');
    messageBox.classList.add('rounded-lg', 'p-3', 'max-w-xs', 'md:max-w-md', 'shadow', 'whitespace-pre-wrap');

    if (role === 'user') {
        messageBox.classList.add('bg-indigo-600', 'text-white');
    } else if (role === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-700');
    } else {
        messageBox.classList.add('bg-white', 'text-gray-800');
    }

    // Set textContent to prevent XSS
    messageBox.textContent = content;

    // For loading indicator, add an ID so we can remove it
    if (role === 'loading') {
        messageBox.classList.add('bg-gray-200', 'text-gray-600', 'italic');
        wrapper.id = 'loading-indicator';
    }

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoadingIndicator() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    // Reset input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // 1. Add user message to UI
    appendMessage('user', content);

    // 2. Add to history
    conversationHistory.push({ role: 'user', content: content });

    // 3. Show loading indicator
    appendMessage('loading', 'جاري الكتابة...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoadingIndicator();

        if (!response.ok) {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('error', 'خطأ: ' + errorMsg);
            return;
        }

        const aiMessage = data.choices[0].message.content;

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

        // Render
        appendMessage('assistant', aiMessage);

    } catch (error) {
        removeLoadingIndicator();
        appendMessage('error', 'حدث خطأ في الاتصال: ' + error.message);
    }
}
