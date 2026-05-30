const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

let chatHistory = [
    { role: "system", content: "أنت مساعد ذكاء اصطناعي مفيد وتتحدث باللغة العربية." }
];

function appendMessage(role, text, isError = false) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('flex', 'w-full');

    // In RTL, user messages should align right natively, but we use flex justify for layout.
    // However, memory indicates: "user messages should be aligned to the left (e.g., using Tailwind 'justify-end' in a flex container) and assistant messages aligned to the right (e.g., using 'justify-start')."
    // So let's follow the memory instructions strictly: user -> left (justify-end in RTL means left visually, or justify-end in normal flex flex-row means end). In RTL dir="rtl", justify-end pushes to the left side.

    if (role === 'user') {
        messageContainer.classList.add('justify-end');
    } else {
        messageContainer.classList.add('justify-start');
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('max-w-[75%]', 'p-4', 'rounded-lg', 'shadow');

    if (role === 'user') {
        messageBubble.classList.add('bg-blue-500', 'text-white', 'rounded-tl-none');
    } else {
        if (isError) {
            messageBubble.classList.add('bg-red-100', 'text-red-700', 'rounded-tr-none', 'border', 'border-red-300');
        } else {
            messageBubble.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
        }
    }

    // XSS protection
    messageBubble.textContent = text;
    messageBubble.style.whiteSpace = 'pre-wrap';

    messageContainer.appendChild(messageBubble);
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    userInput.value = '';
    userInput.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: chatHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error?.message || 'حدث خطأ غير معروف';
            appendMessage('assistant', `خطأ: ${errorMessage}`, true);
            console.error('API Error:', errorMessage);
        } else {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
            chatHistory.push({ role: 'assistant', content: assistantMessage });
        }
    } catch (error) {
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
        console.error('Fetch Error:', error);
    } finally {
        userInput.disabled = false;
        userInput.focus();
    }
});
