document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const errorContainer = document.getElementById('error-container');

    // Store chat history
    let chatHistory = [];

    // Focus input on load
    userInput.focus();

    // Event listeners
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000);
    }

    function appendMessage(role, content, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const innerDiv = document.createElement('div');

        // Styling based on role and error status
        if (role === 'user') {
            innerDiv.className = 'bg-blue-600 text-white rounded-lg rounded-tl-none px-4 py-2 max-w-[80%] shadow-sm';
        } else if (isError) {
            innerDiv.className = 'bg-red-100 text-red-900 rounded-lg rounded-tr-none px-4 py-2 max-w-[80%] shadow-sm border border-red-300';
        } else {
            innerDiv.className = 'bg-blue-100 text-blue-900 rounded-lg rounded-tr-none px-4 py-2 max-w-[80%] shadow-sm';
        }

        const textPara = document.createElement('p');
        textPara.className = 'message-content';

        // Prevent XSS by using textContent
        textPara.textContent = content;

        innerDiv.appendChild(textPara);
        messageDiv.appendChild(innerDiv);
        chatContainer.appendChild(messageDiv);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageDiv;
    }

    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-indicator';
        loadingDiv.className = 'flex justify-start';

        const innerDiv = document.createElement('div');
        innerDiv.className = 'bg-gray-100 text-gray-500 rounded-lg rounded-tr-none px-4 py-2 shadow-sm font-bold loading-dots';
        innerDiv.textContent = 'جاري التفكير';

        loadingDiv.appendChild(innerDiv);
        chatContainer.appendChild(loadingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function hideLoading() {
        const loadingDiv = document.getElementById('loading-indicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    async function handleSendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Disable input while processing
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;
        errorContainer.classList.add('hidden');

        // Add user message to UI
        appendMessage('user', text);

        // Add to history
        chatHistory.push({ role: 'user', content: text });

        // Show loading indicator
        showLoading();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: chatHistory }),
            });

            const data = await response.json();

            hideLoading();

            if (!response.ok) {
                const errorMsg = data.error || data.details || 'حدث خطأ غير معروف';
                throw new Error(errorMsg);
            }

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const aiMessage = data.choices[0].message.content;

                // Add AI message to UI
                appendMessage('assistant', aiMessage);

                // Add to history
                chatHistory.push({ role: 'assistant', content: aiMessage });
            } else {
                throw new Error('استجابة غير صالحة من الخادم');
            }

        } catch (error) {
            hideLoading();
            console.error('Error:', error);

            const errorText = `عذراً، حدث خطأ: ${error.message}`;
            appendMessage('assistant', errorText, true);

            // Remove the last user message from history so they can try again
            // without corrupting the context with unanswered prompts if it failed completely
            chatHistory.pop();

            showError('فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.');

            // Put text back so user doesn't lose it
            if(!userInput.value) {
                userInput.value = text;
            }
        } finally {
            // Re-enable input
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }
});
