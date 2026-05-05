const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const submitButton = document.getElementById('submit-button');

// Store conversation history
let conversationHistory = [];

function addMessageToUI(content, isUser) {
    // Generate unique ID for the text container
    const textId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Determine layout based on RTL (User on right, Assistant on left in RTL usually means user justify-start, but let's follow the standard: user msg on right of screen -> justify-start in RTL or justify-end in LTR. In RTL, justify-start means right side)
    const flexClass = isUser ? 'justify-end' : 'justify-start';
    const bgClass = isUser ? 'bg-blue-100 border-blue-200' : 'bg-white border-gray-200';

    const html = `
        <div class="flex ${flexClass}">
            <div class="rounded-lg p-3 max-w-[80%] shadow shadow-sm border ${bgClass}">
                <p id="${textId}" class="text-gray-800 whitespace-pre-wrap"></p>
            </div>
        </div>
    `;

    chatContainer.insertAdjacentHTML('beforeend', html);

    // Set text content securely to prevent XSS
    document.getElementById(textId).textContent = content;

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingIndicator() {
    const id = 'loading-indicator';
    const html = `
        <div class="flex justify-start" id="${id}">
            <div class="bg-white rounded-lg p-3 max-w-[80%] shadow shadow-sm border border-gray-200 flex items-center gap-2">
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', html);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return id;
}

function removeLoadingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Clear input and disable button
    userInput.value = '';
    submitButton.disabled = true;

    // Add user message to UI
    addMessageToUI(message, true);

    // Add to history
    conversationHistory.push({ role: 'user', content: message });

    // Show loading
    const loadingId = addLoadingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        removeLoadingIndicator(loadingId);

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ أثناء الاتصال بالخادم');
        }

        const assistantMessage = data.choices[0].message.content;

        // Add assistant message to UI
        addMessageToUI(assistantMessage, false);

        // Add to history
        conversationHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        removeLoadingIndicator(loadingId);
        addMessageToUI('عذراً، حدث خطأ: ' + error.message, false);
        // Remove the failed user message from history so it doesn't corrupt context
        conversationHistory.pop();
    } finally {
        submitButton.disabled = false;
        userInput.focus();
    }
});
