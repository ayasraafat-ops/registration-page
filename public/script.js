const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Store conversation history for the API payload
let conversationHistory = [];

function appendMessage(role, content, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex w-full ${role === 'user' ? 'justify-start' : 'justify-end'}`;

    const messageBox = document.createElement('div');
    // Basic styling for the message box
    let boxClasses = 'max-w-[75%] p-3 rounded-lg shadow-sm ';

    if (role === 'user') {
        boxClasses += 'bg-blue-100 text-blue-900 border border-blue-200 rounded-br-none';
    } else {
        if (isError) {
             boxClasses += 'bg-red-100 text-red-900 border border-red-200 rounded-bl-none font-bold';
        } else {
             boxClasses += 'bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none';
        }
    }

    messageBox.className = boxClasses;

    // Prevent XSS by using textContent and CSS pre-wrap
    messageBox.style.whiteSpace = 'pre-wrap';
    messageBox.textContent = content;

    messageWrapper.appendChild(messageBox);
    chatContainer.appendChild(messageWrapper);

    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const wrapper = document.createElement('div');
    wrapper.id = 'loading-indicator';
    wrapper.className = 'flex w-full justify-end'; // Assistant side (RTL)

    const box = document.createElement('div');
    box.className = 'max-w-[75%] p-3 rounded-lg shadow-sm bg-gray-100 text-gray-500 border border-gray-200 rounded-bl-none italic';
    box.textContent = 'جاري الكتابة...';

    wrapper.appendChild(box);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.remove();
    }
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Display user message
    appendMessage('user', text);
    userInput.value = '';

    // 2. Add to conversation history
    conversationHistory.push({ role: 'user', content: text });

    // 3. Show loading
    showLoading();

    // 4. Call API
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        removeLoading();

        if (!response.ok) {
            let errorMsg = 'حدث خطأ غير معروف.';
            try {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message) {
                    errorMsg = `خطأ: ${errorData.error.message}`;
                }
            } catch (e) {
                errorMsg = `خطأ في الخادم (Status: ${response.status})`;
            }
            appendMessage('assistant', errorMsg, true);
            return;
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
             const aiReply = data.choices[0].message.content;
             appendMessage('assistant', aiReply);
             conversationHistory.push({ role: 'assistant', content: aiReply });
        } else {
             appendMessage('assistant', 'عذراً، لم أتمكن من فهم الرد.', true);
        }

    } catch (error) {
        removeLoading();
        appendMessage('assistant', `خطأ في الاتصال: ${error.message}`, true);
    }
}

// Event Listeners
sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});
