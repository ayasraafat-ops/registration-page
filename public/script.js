const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const errorMessageDiv = document.getElementById('error-message');

let conversationHistory = [
    {
        role: "system",
        content: "أنت مساعد ذكي ومفيد تتحدث باللغة العربية بطلاقة. تقدم إجابات دقيقة ومفيدة."
    }
];

function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex');

    // User messages aligned right (RTL context), Assistant left
    if (role === 'user') {
        wrapper.classList.add('justify-start');
    } else {
        wrapper.classList.add('justify-end');
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'p-3', 'rounded-lg', 'shadow-sm');
    messageDiv.style.whiteSpace = 'pre-wrap';

    // Prevent XSS by using textContent
    messageDiv.textContent = content;

    if (role === 'user') {
        messageDiv.classList.add('bg-indigo-100', 'text-indigo-900', 'rounded-tl-none');
    } else {
        messageDiv.classList.add('bg-gray-100', 'text-gray-800', 'rounded-tr-none');
    }

    wrapper.appendChild(messageDiv);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
    setTimeout(() => {
        errorMessageDiv.classList.add('hidden');
    }, 5000);
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageText = userInput.value.trim();
    if (!messageText) return;

    // Append user message to UI
    appendMessage('user', messageText);

    // Add to history
    conversationHistory.push({ role: "user", content: messageText });

    // Clear input and adjust height
    userInput.value = '';

    // Show a loading indicator (optional but good for UX)
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = 'loading-indicator';
    loadingWrapper.classList.add('flex', 'justify-end');
    loadingWrapper.innerHTML = `
        <div class="message bg-gray-100 p-3 rounded-lg rounded-tr-none text-gray-500 shadow-sm animate-pulse">
            جاري التفكير...
        </div>
    `;
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
        const loadingNode = document.getElementById('loading-indicator');
        if (loadingNode) loadingNode.remove();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير معروف في الخادم');
        }

        const assistantMessage = data.choices[0].message.content;

        // Add to UI
        appendMessage('assistant', assistantMessage);

        // Add to history
        conversationHistory.push({ role: "assistant", content: assistantMessage });

    } catch (error) {
        // Remove loading indicator
        const loadingNode = document.getElementById('loading-indicator');
        if (loadingNode) loadingNode.remove();

        console.error('Error fetching response:', error);
        showError('حدث خطأ: ' + error.message);

        // Remove the last user message from history so they can retry without duplication
        conversationHistory.pop();
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight < 120 ? this.scrollHeight : 120) + 'px';
});

// Submit on Enter (prevent default newline), allow Shift+Enter for newline
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
    }
});
