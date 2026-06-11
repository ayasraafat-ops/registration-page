const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');

let conversationHistory = [
    { role: "system", content: "أنت مساعد ذكي ومفيد تتحدث باللغة العربية. اسمك مساعد Qwen." }
];

function appendMessage(role, content, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'w-full');

    // In RTL: user to the right (flex-start when reversed direction visually, but with dir="rtl", flex justify-start pushes to right)
    // Wait, let's stick to standard chat semantics.
    // User messages typically on the left or right depending on preference.
    // In RTL, user messages usually on the left visually (start), AI on the right.
    // Let's use `justify-end` for user and `justify-start` for AI, which in RTL:
    // justify-end -> left side
    // justify-start -> right side

    if (role === 'user') {
        messageDiv.classList.add('justify-end'); // visually left in RTL
    } else {
        messageDiv.classList.add('justify-start'); // visually right in RTL
    }

    const innerDiv = document.createElement('div');
    innerDiv.classList.add('rounded-lg', 'p-3', 'max-w-[80%]', 'shadow', 'message-content');

    if (isError) {
        innerDiv.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-300');
    } else if (role === 'user') {
        innerDiv.classList.add('bg-blue-500', 'text-white');
    } else {
        innerDiv.classList.add('bg-gray-200', 'text-gray-800');
    }

    innerDiv.textContent = content; // XSS protection

    messageDiv.appendChild(innerDiv);
    chatContainer.appendChild(messageDiv);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setLoadingState(isLoading) {
    if (isLoading) {
        sendButton.disabled = true;
        sendButton.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        messageInput.disabled = true;
    } else {
        sendButton.disabled = false;
        sendButton.textContent = 'إرسال';
        messageInput.disabled = false;
        messageInput.focus();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Display user message
    appendMessage('user', userMessage);
    messageInput.value = '';

    // Update history
    conversationHistory.push({ role: 'user', content: userMessage });

    setLoadingState(true);

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
            throw new Error(data.error?.message || 'حدث خطأ غير معروف');
        }

        const aiMessage = data.choices[0].message.content;

        // Display AI message
        appendMessage('assistant', aiMessage);

        // Update history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        console.error('Error:', error);
        appendMessage('system', `حدث خطأ: ${error.message}`, true);
        // Remove the last user message from history so they can retry
        conversationHistory.pop();
    } finally {
        setLoadingState(false);
    }
});
