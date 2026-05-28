const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatHistory = document.getElementById('chat-history');
const errorMessageDiv = document.getElementById('error-message');
const submitBtn = document.getElementById('submit-btn');

// Initialize conversation with the system/initial assistant greeting
let messages = [
    // We don't necessarily need to send the initial hardcoded greeting back,
    // but if we want context, we can store it. Let's start fresh with an empty array.
];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text) return;

    // Clear previous errors
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';

    // Append user message to UI
    appendMessage(text, 'user');

    // Add to state
    messages.push({ role: "user", content: text });

    // Clear input
    userInput.value = '';
    userInput.disabled = true;
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messages })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'Network response was not ok');
        }

        const assistantMessage = data.choices[0].message.content;

        // Append assistant message to UI
        appendMessage(assistantMessage, 'assistant');

        // Add to state
        messages.push({ role: "assistant", content: assistantMessage });

    } catch (error) {
        errorMessageDiv.textContent = `خطأ: ${error.message}`;
        errorMessageDiv.classList.remove('hidden');
        // Optionally remove the last user message from state if it failed?
        // For now, leave it so they can retry.
    } finally {
        userInput.disabled = false;
        submitBtn.disabled = false;
        userInput.focus();
        scrollToBottom();
    }
});

function appendMessage(text, sender) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('flex', 'w-full');

    const bubble = document.createElement('div');
    bubble.classList.add('rounded-lg', 'py-2', 'px-4', 'max-w-[80%]', 'whitespace-pre-wrap');

    // XSS Mitigation: use textContent instead of innerHTML
    bubble.textContent = text;

    if (sender === 'user') {
        // RTL Layout: user right aligned
        // Wait, in RTL dir="rtl", "justify-start" is right, "justify-end" is left.
        // User aligned to left
        messageContainer.classList.add('justify-end');
        bubble.classList.add('bg-blue-600', 'text-white');
    } else {
        // Assistant aligned to right
        messageContainer.classList.add('justify-start');
        bubble.classList.add('bg-gray-200', 'text-gray-800');
    }

    messageContainer.appendChild(bubble);
    chatHistory.appendChild(messageContainer);
    scrollToBottom();
}

function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
