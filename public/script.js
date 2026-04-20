const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [];

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-4 flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const innerDiv = document.createElement('div');
    innerDiv.className = `p-4 rounded-lg shadow inline-block max-w-[80%] ${
        role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'
    }`;

    // Use textContent to prevent XSS, and CSS to preserve newlines
    innerDiv.textContent = content;
    innerDiv.style.whiteSpace = 'pre-wrap';

    messageDiv.appendChild(innerDiv);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Disable input while processing
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Show user message
    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'mb-4 flex justify-start';
    loadingDiv.innerHTML = `<div class="bg-gray-200 text-gray-500 p-4 rounded-lg shadow inline-block">جاري التفكير...</div>`;
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        // Remove loading indicator
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            throw new Error('فشل في الاتصال بالخادم');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }

        const aiMessage = data.choices[0].message.content;

        // Add to history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

        // Show AI message
        appendMessage('assistant', aiMessage);

    } catch (error) {
        // Remove loading indicator if still there
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) loadingElement.remove();

        appendMessage('assistant', `حدث خطأ: ${error.message}`);
        // Remove the failed user message from history so it doesn't mess up future requests
        conversationHistory.pop();
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}
