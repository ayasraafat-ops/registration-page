const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const submitButton = chatForm.querySelector('button');

// Store conversation history
let messages = [
    { role: 'system', content: 'You are a helpful assistant.' }
];

function appendMessage(role, content, isLoading = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `max-w-[75%] p-4 rounded-2xl shadow-sm ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
    }`;

    // Prevent XSS by using textContent
    messageBox.textContent = content;
    messageBox.style.whiteSpace = 'pre-wrap';

    if (isLoading) {
        messageBox.id = 'loading-indicator';
        messageBox.classList.add('animate-pulse');
    }

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.parentElement.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = userInput.value.trim();
    if (!userText) return;

    // Append user message
    appendMessage('user', userText);
    messages.push({ role: 'user', content: userText });

    // Clear input and disable
    userInput.value = '';
    userInput.disabled = true;
    submitButton.disabled = true;

    // Show loading
    appendMessage('assistant', 'جاري الكتابة...', true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        removeLoadingIndicator();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير معروف');
        }

        const aiText = data.choices[0].message.content;
        appendMessage('assistant', aiText);
        messages.push({ role: 'assistant', content: aiText });

    } catch (error) {
        removeLoadingIndicator();
        appendMessage('assistant', `خطأ: ${error.message}`);
    } finally {
        userInput.disabled = false;
        submitButton.disabled = false;
        userInput.focus();
    }
});