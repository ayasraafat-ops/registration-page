const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Keep track of conversation history
let conversationHistory = [];

// Helper function to append messages safely to the DOM
function appendMessage(role, content) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const messageDiv = document.createElement('div');
    messageDiv.className = role === 'user'
        ? 'bg-blue-600 text-white rounded-lg p-3 max-w-[80%] shadow-sm'
        : 'bg-gray-200 text-gray-800 rounded-lg p-3 max-w-[80%] shadow-sm';

    const p = document.createElement('p');
    p.className = 'whitespace-pre-wrap';
    p.textContent = content; // XSS protection: safely textContent instead of innerHTML

    messageDiv.appendChild(p);
    wrapperDiv.appendChild(messageDiv);
    chatBox.appendChild(wrapperDiv);

    // Scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to handle sending a message
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear input and disable button temporarily
    userInput.value = '';
    sendBtn.disabled = true;
    sendBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Show loading state
    const loadingId = 'loading-' + Date.now();
    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'flex justify-start';
    loadingWrapper.innerHTML = `<div class="bg-gray-200 text-gray-800 rounded-lg p-3 max-w-[80%] shadow-sm"><p class="whitespace-pre-wrap animate-pulse">جاري التفكير...</p></div>`;
    chatBox.appendChild(loadingWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        // Remove loading state
        document.getElementById(loadingId).remove();

        if (!response.ok) {
            throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
        }

        if (data.choices && data.choices.length > 0) {
            const assistantMessage = data.choices[0].message.content;
            appendMessage('assistant', assistantMessage);
            conversationHistory.push({ role: 'assistant', content: assistantMessage });
        } else {
            throw new Error('Invalid response format from API.');
        }

    } catch (error) {
        // Remove loading state if it still exists
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        console.error('Error:', error);
        appendMessage('assistant', `❌ عذراً، حدث خطأ: ${error.message}`);
    } finally {
        // Re-enable button
        sendBtn.disabled = false;
        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        userInput.focus();
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    // Send on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});