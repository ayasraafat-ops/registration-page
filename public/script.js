const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(content, sender, isError = false) {
    const wrapperDiv = document.createElement('div');
    // For RTL layout: user aligns right in the flow but visual design often has user on the right, AI on left.
    // Wait, let's look at the plan: "user messages will align to the left and assistant messages to the right."
    // Usually in RTL, user is right, AI is left. But plan says: "user (aligned left) and assistant (aligned right)".
    // Let's stick to the plan: User -> justify-end (left in RTL). Assistant -> justify-start (right in RTL).

    wrapperDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `p-3 max-w-[80%] rounded-lg shadow-sm border ${
        sender === 'user'
            ? 'bg-blue-100 text-blue-900 border-blue-200 rounded-tl-none'
            : isError
                ? 'bg-red-100 text-red-900 border-red-200 rounded-tr-none'
                : 'bg-gray-100 text-gray-800 border-gray-200 rounded-tr-none'
    }`;

    const paragraph = document.createElement('p');
    paragraph.className = 'whitespace-pre-wrap';
    paragraph.textContent = content; // XSS protection

    bubbleDiv.appendChild(paragraph);
    wrapperDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(wrapperDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoading() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = 'loading-indicator';
    wrapperDiv.className = 'flex justify-start';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'p-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg rounded-tr-none flex items-center space-x-2 space-x-reverse';

    bubbleDiv.innerHTML = `
        <div class="animate-pulse flex space-x-1 space-x-reverse">
            <div class="h-2 w-2 bg-gray-400 rounded-full"></div>
            <div class="h-2 w-2 bg-gray-400 rounded-full animation-delay-200"></div>
            <div class="h-2 w-2 bg-gray-400 rounded-full animation-delay-400"></div>
        </div>
        <span class="text-sm mr-2">جاري الكتابة...</span>
    `;

    wrapperDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(wrapperDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function handleSubmit(e) {
    if (e) e.preventDefault();

    const text = messageInput.value.trim();
    if (!text || sendButton.disabled) return;

    // Disable input while processing
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Display user message
    appendMessage(text, 'user');

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();
        removeLoading();

        if (!response.ok) {
            throw new Error(data.error?.message || 'حدث خطأ غير معروف');
        }

        const aiReply = data.choices[0].message.content;
        appendMessage(aiReply, 'assistant');
        conversationHistory.push({ role: 'assistant', content: aiReply });

    } catch (error) {
        removeLoading();
        appendMessage(`خطأ: ${error.message}`, 'assistant', true);
        // Remove the last user message from history if the API failed,
        // or keep it to let them try again. Let's remove it so they can resend easily.
        conversationHistory.pop();
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

chatForm.addEventListener('submit', handleSubmit);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            handleSubmit();
        }
    }
});
