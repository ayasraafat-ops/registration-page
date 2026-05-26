const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');

// History array matching the OpenRouter API requirements
let messageHistory = [];

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value === '') {
        this.style.height = 'auto';
    }
});

// Handle enter key to submit (Shift+Enter for new line)
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if(this.value.trim() !== '') {
            chatForm.dispatchEvent(new Event('submit'));
        }
    }
});

function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');
    // For RTL: User -> Left (justify-end in RTL context), Assistant -> Right (justify-start)
    wrapperDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const messageDiv = document.createElement('div');

    // Base styles
    let styles = 'p-3 rounded-lg max-w-3xl shadow-sm whitespace-pre-wrap ';

    if (isError) {
        styles += 'bg-red-100 text-red-800 border border-red-300';
    } else if (role === 'user') {
        styles += 'bg-blue-600 text-white';
    } else {
        styles += 'bg-gray-200 text-gray-800';
    }

    messageDiv.className = styles;

    // Prevent XSS by strictly using textContent
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatBox.appendChild(wrapperDiv);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function setLoading(isLoading) {
    messageInput.disabled = isLoading;
    sendBtn.disabled = isLoading;
    if (isLoading) {
        btnText.classList.add('hidden');
        btnSpinner.classList.remove('hidden');
        sendBtn.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
        btnText.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
        sendBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        messageInput.focus();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userText = messageInput.value.trim();
    if (!userText) return;

    // Reset input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Render user message
    appendMessage('user', userText);

    // Add to history
    messageHistory.push({ role: 'user', content: userText });

    setLoading(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messageHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error || 'حدث خطأ غير معروف';
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
            // Optionally remove the failed user message from history, or keep it.
            // For now, we'll keep it so they can see context, but we won't add an AI reply.
        } else {
            const assistantReply = data.choices[0].message.content;
            appendMessage('assistant', assistantReply);
            messageHistory.push({ role: 'assistant', content: assistantReply });
        }
    } catch (error) {
        console.error('Network Error:', error);
        appendMessage('assistant', `عذراً، حدث خطأ في الاتصال بالخادم: ${error.message}`, true);
    } finally {
        setLoading(false);
    }
});
