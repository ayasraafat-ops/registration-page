const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const submitBtn = document.querySelector('button[type="submit"]');
const btnText = document.getElementById('btn-text');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-message');

let conversationHistory = [
    { role: "system", content: "أنت مساعد ذكاء اصطناعي مفيد وودود يتحدث اللغة العربية." }
];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Hide error
    errorContainer.classList.add('hidden');
    errorContainer.textContent = '';

    // Add user message to UI and history
    appendMessage('user', message);
    conversationHistory.push({ role: "user", content: message });
    userInput.value = '';

    // Set loading state
    setLoading(true);

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
            throw new Error(data.error?.message || "حدث خطأ أثناء الاتصال بالخادم.");
        }

        const aiReply = data.choices[0].message.content;
        appendMessage('assistant', aiReply);
        conversationHistory.push({ role: "assistant", content: aiReply });

    } catch (error) {
        console.error("Chat Error:", error);
        errorContainer.textContent = `خطأ: ${error.message}`;
        errorContainer.classList.remove('hidden');

        // Remove the last user message from history if the request failed
        conversationHistory.pop();
    } finally {
        setLoading(false);
    }
});

function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
        role === 'user'
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
    }`;

    messageDiv.style.whiteSpace = 'pre-wrap';
    // Use textContent to prevent XSS
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setLoading(isLoading) {
    userInput.disabled = isLoading;
    submitBtn.disabled = isLoading;
    if (isLoading) {
        btnText.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        loadingSpinner.classList.add('hidden');
        userInput.focus();
    }
}
