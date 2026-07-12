const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const sendBtn = document.getElementById('sendBtn');

// Maintain conversation history
let conversationHistory = [];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Disable input while processing
    userInput.disabled = true;
    sendBtn.disabled = true;

    // 1. Add User Message to UI
    appendMessage('user', message);

    // Add to history
    conversationHistory.push({ role: 'user', content: message });

    // Clear input
    userInput.value = '';

    // 2. Show Loading Indicator
    const loadingId = appendLoading();

    try {
        // 3. Send to Backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove Loading Indicator
        removeMessage(loadingId);

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ في الاتصال بالخادم.');
        }

        const aiResponse = data.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من توليد استجابة.';

        // 4. Add AI Message to UI
        appendMessage('assistant', aiResponse);

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        removeMessage(loadingId);
        appendMessage('error', `خطأ: ${error.message}`);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
});

function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex mb-4';

    // In RTL:
    // User is right (justify-start in flex-row where flex-direction is row-reverse inherently? No, in dir="rtl", flex-row starts from right)
    // Actually, in standard tailwind with dir="rtl", `justify-start` starts from the right.
    // So user should be `justify-start` and assistant `justify-end`.

    if (role === 'user') {
        wrapperDiv.classList.add('justify-start');
    } else if (role === 'assistant') {
        wrapperDiv.classList.add('justify-end');
    } else if (role === 'error') {
        wrapperDiv.classList.add('justify-center');
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'rounded-lg p-3 shadow max-w-[80%] border message-content';

    if (role === 'user') {
        messageDiv.classList.add('bg-indigo-100', 'border-indigo-200', 'text-indigo-900');
    } else if (role === 'assistant') {
        messageDiv.classList.add('bg-white', 'border-gray-200', 'text-gray-800');
    } else if (role === 'error') {
        messageDiv.classList.add('bg-red-100', 'border-red-300', 'text-red-700', 'text-sm');
    }

    // Use textContent to prevent XSS
    messageDiv.textContent = content;

    wrapperDiv.appendChild(messageDiv);
    chatBox.appendChild(wrapperDiv);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex mb-4 justify-end';
    wrapperDiv.id = id;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'rounded-lg p-3 shadow max-w-[80%] border border-gray-200 bg-gray-50 text-gray-500 italic text-sm';

    messageDiv.textContent = 'جاري الكتابة...';

    wrapperDiv.appendChild(messageDiv);
    chatBox.appendChild(wrapperDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
    }
}
