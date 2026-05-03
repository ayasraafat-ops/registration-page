document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInputField = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');

    let chatHistory = [];

    function addMessageToUI(content, isUser) {
        // In RTL, user is left (logical end), assistant is right (logical start)
        const alignmentClass = isUser ? 'justify-end' : 'justify-start';
        const bgClass = isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800';

        const messageWrapperId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const html = `
            <div class="flex ${alignmentClass}">
                <div id="${messageWrapperId}" class="${bgClass} rounded-lg p-3 max-w-[80%] whitespace-pre-wrap"></div>
            </div>
        `;

        chatContainer.insertAdjacentHTML('beforeend', html);

        // Securely add text content to prevent XSS
        const messageDiv = document.getElementById(messageWrapperId);
        messageDiv.textContent = content;

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addLoadingIndicator() {
        const loadingId = 'loading-indicator';
        const html = `
            <div id="${loadingId}" class="flex justify-start">
                <div class="bg-gray-200 text-gray-800 rounded-lg p-3 flex items-center gap-2">
                    <div class="loader"></div>
                    <span>جاري التفكير...</span>
                </div>
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', html);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return loadingId;
    }

    function removeLoadingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.remove();
        }
    }

    async function handleSend() {
        const userText = userInputField.value.trim();
        if (!userText) return;

        userInputField.value = '';
        userInputField.disabled = true;
        sendButton.disabled = true;

        addMessageToUI(userText, true);

        chatHistory.push({ role: 'user', content: userText });

        const loadingId = addLoadingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: chatHistory })
            });

            const data = await response.json();

            removeLoadingIndicator(loadingId);

            if (response.ok && data.choices && data.choices.length > 0) {
                const assistantReply = data.choices[0].message.content;
                addMessageToUI(assistantReply, false);
                chatHistory.push({ role: 'assistant', content: assistantReply });
            } else {
                addMessageToUI('عذراً، حدث خطأ أثناء الاتصال بالخادم.', false);
                console.error('Error:', data);
            }

        } catch (error) {
            removeLoadingIndicator(loadingId);
            addMessageToUI('عذراً، حدث خطأ غير متوقع.', false);
            console.error('Error:', error);
        } finally {
            userInputField.disabled = false;
            sendButton.disabled = false;
            userInputField.focus();
        }
    }

    sendButton.addEventListener('click', handleSend);
    userInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });
});
