const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const sendBtn = document.getElementById('sendBtn');

// Maintain conversation history for context
let conversationHistory = [];

// Helper function to create loading indicator
function createLoadingIndicator() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex justify-start w-full loading-indicator';
    wrapperDiv.id = 'loadingIndicator';

    const innerDiv = document.createElement('div');
    innerDiv.className = 'bg-white border border-gray-200 text-gray-800 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] relative flex items-center gap-2';

    const spinner = document.createElement('div');
    spinner.className = 'w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin';

    const textSpan = document.createElement('span');
    textSpan.className = 'text-gray-500 text-sm font-medium';
    textSpan.textContent = 'جاري التفكير...';

    innerDiv.appendChild(spinner);
    innerDiv.appendChild(textSpan);
    wrapperDiv.appendChild(innerDiv);

    return wrapperDiv;
}

// Function to append a message to the chat UI
function appendMessage(role, content, isError = false) {
    const wrapperDiv = document.createElement('div');

    if (role === 'user') {
        wrapperDiv.className = 'flex justify-end w-full';

        const innerDiv = document.createElement('div');
        // User messages: rounded-tl-none (RTL context)
        innerDiv.className = 'bg-blue-600 text-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] relative';

        const nameSpan = document.createElement('div');
        nameSpan.className = 'font-bold text-blue-100 text-sm mb-1';
        nameSpan.textContent = 'أنت';

        const contentP = document.createElement('p');
        contentP.className = 'whitespace-pre-wrap leading-relaxed';
        contentP.textContent = content; // XSS protection

        innerDiv.appendChild(nameSpan);
        innerDiv.appendChild(contentP);
        wrapperDiv.appendChild(innerDiv);

    } else {
        // Assistant or Error
        wrapperDiv.className = 'flex justify-start w-full';

        const innerDiv = document.createElement('div');
        if (isError) {
             // Error styling container
             innerDiv.className = 'bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] relative';
        } else {
             // Assistant messages: rounded-tr-none (RTL context)
             innerDiv.className = 'bg-white border border-gray-200 text-gray-800 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] relative';
        }

        const nameSpan = document.createElement('div');
        nameSpan.className = `font-bold text-sm mb-1 ${isError ? 'text-red-700' : 'text-blue-600'}`;
        nameSpan.textContent = isError ? 'خطأ' : 'المساعد';

        const contentP = document.createElement('p');
        contentP.className = 'whitespace-pre-wrap leading-relaxed';
        contentP.textContent = content; // XSS protection

        innerDiv.appendChild(nameSpan);
        innerDiv.appendChild(contentP);
        wrapperDiv.appendChild(innerDiv);
    }

    chatBox.appendChild(wrapperDiv);
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Handle form submission
async function handleSubmit(e) {
    if (e) e.preventDefault();

    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);

    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Clear input & disable button
    userInput.value = '';
    sendBtn.disabled = true;

    // Show loading
    const loadingEl = createLoadingIndicator();
    chatBox.appendChild(loadingEl);
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

        // Remove loading
        if (document.getElementById('loadingIndicator')) {
            document.getElementById('loadingIndicator').remove();
        }

        if (!response.ok) {
            const errorMsg = data.error ? data.error.message : 'حدث خطأ غير معروف';
            appendMessage('assistant', `عذراً، حدث خطأ: ${errorMsg}`, true);
            // Optionally remove the last user message from history on error, or keep it.
        } else {
            const assistantMsg = data.choices[0].message.content;
            appendMessage('assistant', assistantMsg);
            // Add to history
            conversationHistory.push({ role: 'assistant', content: assistantMsg });
        }

    } catch (error) {
        // Remove loading
        if (document.getElementById('loadingIndicator')) {
            document.getElementById('loadingIndicator').remove();
        }
        appendMessage('assistant', `خطأ في الاتصال بالخادم: ${error.message}`, true);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
chatForm.addEventListener('submit', handleSubmit);

// Handle Enter keypress (avoid duplicate submission if disabled)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            handleSubmit();
        }
    }
});
