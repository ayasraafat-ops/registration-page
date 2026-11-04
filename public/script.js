const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const sendButton = document.getElementById('send-button');

let messages = [
    { role: 'system', content: 'أنت مساعد ذكي ومفيد تتحدث باللغة العربية.' }
];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSend();
});

userInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        e.preventDefault();
        await handleSend();
    }
});

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // Append user message to UI
    appendMessage(text, 'user');

    // Add to state
    messages.push({ role: 'user', content: text });

    // Clear input & disable button
    userInput.value = '';
    sendButton.disabled = true;

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    appendLoading(loadingId);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        removeElement(loadingId);

        if (!response.ok) {
            const errorMessage = data.error?.message || 'حدث خطأ غير متوقع';
            appendMessage(`خطأ: ${errorMessage}`, 'error');
        } else {
            const aiText = data.choices[0].message.content;
            appendMessage(aiText, 'assistant');
            messages.push({ role: 'assistant', content: aiText });
        }
    } catch (error) {
        removeElement(loadingId);
        appendMessage(`خطأ في الاتصال: ${error.message}`, 'error');
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

function appendMessage(text, type) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = 'p-3 rounded-lg shadow max-w-[80%]';

    if (type === 'user') {
        bubble.classList.add('bg-blue-100', 'rounded-tl-none');
    } else if (type === 'error') {
        bubble.classList.add('bg-red-100', 'text-red-700', 'rounded-tr-none');
    } else {
        bubble.classList.add('bg-white', 'rounded-tr-none');
    }

    const paragraph = document.createElement('p');
    paragraph.className = 'whitespace-pre-wrap';
    paragraph.textContent = text; // XSS Protection

    bubble.appendChild(paragraph);
    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading(id) {
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'flex justify-start';

    const bubble = document.createElement('div');
    bubble.className = 'bg-gray-200 p-3 rounded-lg rounded-tr-none shadow max-w-[80%]';

    const paragraph = document.createElement('p');
    paragraph.className = 'text-gray-500 animate-pulse';
    paragraph.textContent = 'جاري التفكير...';

    bubble.appendChild(paragraph);
    wrapper.appendChild(bubble);
    chatContainer.appendChild(wrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}
