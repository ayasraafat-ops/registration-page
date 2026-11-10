const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

let conversationHistory = [];

function appendMessage(text, isUser = false, isError = false) {
    const container = document.createElement('div');
    container.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');

    if (isUser) {
        bubble.className = 'bg-indigo-600 text-white p-3 rounded-lg rounded-tl-none max-w-[80%] shadow-sm';
    } else if (isError) {
        bubble.className = 'bg-red-100 text-red-800 p-3 rounded-lg rounded-tr-none max-w-[80%] border border-red-200 shadow-sm';
    } else {
        bubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tr-none max-w-[80%] shadow-sm';
    }

    const p = document.createElement('p');
    p.style.whiteSpace = 'pre-wrap';
    p.textContent = text;

    bubble.appendChild(p);
    container.appendChild(bubble);
    chatBox.appendChild(container);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage(text, true);
    userInput.value = '';

    // Disable input while waiting
    sendBtn.disabled = true;
    userInput.disabled = true;

    // Update conversation history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'flex justify-start';
    loadingContainer.id = 'loadingIndicator';
    loadingContainer.innerHTML = '<div class="bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none max-w-[80%] shadow-sm animate-pulse">جاري التفكير...</div>';
    chatBox.appendChild(loadingContainer);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading indicator
        const loadingEl = document.getElementById('loadingIndicator');
        if (loadingEl) loadingEl.remove();

        if (response.ok && data.choices && data.choices.length > 0) {
            const aiMessage = data.choices[0].message.content;
            conversationHistory.push({ role: 'assistant', content: aiMessage });
            appendMessage(aiMessage, false);
        } else {
            const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف.';
            appendMessage(`خطأ: ${errorMsg}`, false, true);
        }

    } catch (error) {
        const loadingEl = document.getElementById('loadingIndicator');
        if (loadingEl) loadingEl.remove();

        appendMessage(`خطأ في الاتصال: ${error.message}`, false, true);
    } finally {
        // Re-enable input
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
});
