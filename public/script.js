const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');

let messages = [
    { role: 'system', content: 'أنت مساعد ذكي ومفيد. تتحدث باللغة العربية.' }
];

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value === '') {
        this.style.height = '48px';
    }
});

// Handle Enter key (Shift+Enter for new line)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

function addMessageToUI(content, isUser) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${isUser ? 'justify-end' : 'items-start'}`;

    const innerDiv = document.createElement('div');
    innerDiv.className = `rounded-lg p-3 max-w-[80%] ${
        isUser ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'
    }`;

    const p = document.createElement('p');
    p.className = 'whitespace-pre-wrap';
    p.textContent = content; // Using textContent for XSS protection

    innerDiv.appendChild(p);
    wrapper.appendChild(innerDiv);
    chatBox.appendChild(wrapper);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function setLoading(isLoading) {
    if (isLoading) {
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        sendBtn.disabled = true;
        userInput.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    addMessageToUI(text, true);
    messages.push({ role: 'user', content: text });

    // Clear input
    userInput.value = '';
    userInput.style.height = '48px';

    setLoading(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices.length > 0) {
            const assistantMessage = data.choices[0].message.content;
            addMessageToUI(assistantMessage, false);
            messages.push({ role: 'assistant', content: assistantMessage });
        } else {
            console.error('Error from server:', data);
            addMessageToUI('عذراً، حدث خطأ أثناء معالجة طلبك.', false);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        addMessageToUI('عذراً، لا يمكن الاتصال بالخادم الآن.', false);
    } finally {
        setLoading(false);
    }
}
