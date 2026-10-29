const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

// Handle form submit
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSubmit();
});

// Handle Enter keypress
userInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            await handleSubmit();
        }
    }
});

async function handleSubmit() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input and button
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Append user message
    appendMessage(text, 'user');
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingId = appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeElement(loadingId);

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'حدث خطأ غير معروف');
        }

        const aiMessage = data.choices[0].message.content;
        appendMessage(aiMessage, 'assistant');
        conversationHistory.push({ role: 'assistant', content: aiMessage });

    } catch (error) {
        removeElement(loadingId);
        appendMessage(`خطأ: ${error.message}`, 'error');
        // Remove the last user message from history if the request failed
        conversationHistory.pop();
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function appendMessage(text, role) {
    const wrapper = document.createElement('div');
    const isUser = role === 'user';
    const isError = role === 'error';

    wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');

    // Base classes
    bubble.className = 'p-3 rounded-lg max-w-3xl whitespace-pre-wrap';

    if (isUser) {
        bubble.classList.add('bg-blue-600', 'text-white', 'rounded-tl-none');
    } else if (isError) {
        bubble.classList.add('bg-red-100', 'text-red-700', 'rounded-tr-none', 'border', 'border-red-300');
    } else {
        bubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    }

    bubble.textContent = text; // XSS protection
    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none max-w-3xl animate-pulse';
    bubble.textContent = 'جاري الكتابة...';

    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return id;
}

function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
