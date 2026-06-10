const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history
let conversationHistory = [];

function appendMessage(role, content) {
    const isUser = role === 'user';

    // Container for alignment
    const messageRow = document.createElement('div');
    messageRow.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    // Bubble
    const bubble = document.createElement('div');
    bubble.className = `p-4 rounded-lg shadow max-w-[80%] ${
        isUser
            ? 'bg-blue-600 text-white rounded-tl-none'
            : 'bg-white text-gray-800 rounded-tr-none'
    }`;

    // Text content - XSS protection via textContent
    const textNode = document.createElement('p');
    textNode.className = 'message-content';
    textNode.textContent = content;

    bubble.appendChild(textNode);
    messageRow.appendChild(bubble);
    chatContainer.appendChild(messageRow);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    userInput.value = '';
    sendButton.disabled = true;

    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingRow = document.createElement('div');
    loadingRow.id = loadingId;
    loadingRow.className = 'flex justify-start';
    loadingRow.innerHTML = `
        <div class="bg-gray-200 text-gray-600 p-4 rounded-lg rounded-tr-none shadow max-w-[80%]">
            <p>جاري التفكير...</p>
        </div>
    `;
    chatContainer.appendChild(loadingRow);
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

        // Remove loading
        document.getElementById(loadingId).remove();

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'حدث خطأ غير معروف');
        }

        const aiText = data.choices[0].message.content;

        // Add AI response to UI and history
        appendMessage('assistant', aiText);
        conversationHistory.push({ role: 'assistant', content: aiText });

    } catch (error) {
        // Remove loading if it still exists
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();

        console.error('Error:', error);
        appendMessage('assistant', `عذراً، حدث خطأ: ${error.message}`);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
