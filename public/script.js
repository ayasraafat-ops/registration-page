const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const submitBtn = document.getElementById('submit-btn');

let conversationHistory = [
    { role: "system", content: "أنت مساعد ذكاء اصطناعي مفيد يتحدث باللغة العربية." }
];

function appendMessage(role, content, isError = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    messageBox.className = `px-4 py-3 shadow-sm max-w-[80%] whitespace-pre-wrap ${
        role === 'user'
            ? 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none'
            : (isError ? 'bg-red-200 text-red-900 rounded-2xl rounded-tr-none' : 'bg-blue-100 text-blue-900 rounded-2xl rounded-tr-none')
    }`;

    // Using textContent to prevent XSS
    messageBox.textContent = content;

    wrapper.appendChild(messageBox);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text) return;

    // Append user message
    appendMessage('user', text);
    conversationHistory.push({ role: "user", content: text });

    userInput.value = '';
    userInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-end w-full';
    const loadingBox = document.createElement('div');
    loadingBox.className = 'bg-blue-50 text-blue-500 px-4 py-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] text-sm';
    loadingBox.textContent = 'جاري التفكير...';
    loadingWrapper.appendChild(loadingBox);
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
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'Unknown error occurred');
        }

        const aiContent = data.choices[0].message.content;
        appendMessage('assistant', aiContent);
        conversationHistory.push({ role: "assistant", content: aiContent });

    } catch (error) {
        // Remove loading indicator in case of error too
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', `Error: ${error.message}`, true);
    } finally {
        userInput.disabled = false;
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        userInput.focus();
    }
});
