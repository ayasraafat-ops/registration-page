document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatContainer = document.getElementById('chat-container');
    const sendButton = document.getElementById('send-button');

    // Store message history to send to the API for context
    let messages = [
        { role: "system", content: "أنت مساعد ذكاء اصطناعي مفيد. يجب أن تتحدث باللغة العربية بوضوح." }
    ];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const messageText = userInput.value.trim();
        if (!messageText) return;

        // Add user message to UI
        addMessageToUI('user', messageText);

        // Add user message to state
        messages.push({ role: "user", content: messageText });

        // Clear input and disable button
        userInput.value = '';
        sendButton.disabled = true;
        sendButton.classList.add('opacity-50', 'cursor-not-allowed');

        // Add loading indicator
        const loadingId = addLoadingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages })
            });

            const data = await response.json();

            // Remove loading indicator
            removeLoadingIndicator(loadingId);

            if (response.ok && data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content;

                // Add AI message to UI
                addMessageToUI('assistant', aiResponse);

                // Add AI message to state
                messages.push({ role: "assistant", content: aiResponse });
            } else {
                addMessageToUI('system', 'عذراً، حدث خطأ أثناء الاتصال بالخادم.');
                console.error('API Error:', data.error);
            }
        } catch (error) {
            removeLoadingIndicator(loadingId);
            addMessageToUI('system', 'عذراً، حدث خطأ في الشبكة.');
            console.error('Network Error:', error);
        } finally {
            // Re-enable button
            sendButton.disabled = false;
            sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
            userInput.focus();
        }
    });

    function addMessageToUI(role, text) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'flex w-full';

        const messageBox = document.createElement('div');
        messageBox.className = 'p-3 rounded-lg shadow max-w-[80%]';

        // Use textContent and white-space: pre-wrap to prevent XSS and preserve line breaks
        messageBox.textContent = text;
        messageBox.style.whiteSpace = 'pre-wrap';

        if (role === 'user') {
            // User: align left in RTL (justify-end)
            messageWrapper.classList.add('justify-end');
            messageBox.classList.add('bg-blue-100', 'text-blue-900', 'rounded-tl-none');
        } else if (role === 'assistant') {
            // Assistant: align right in RTL (justify-start)
            messageWrapper.classList.add('justify-start');
            messageBox.classList.add('bg-white', 'text-gray-800', 'rounded-tr-none');
        } else {
            // System/Error
            messageWrapper.classList.add('justify-center');
            messageBox.classList.add('bg-red-100', 'text-red-800', 'text-sm', 'text-center', 'w-full', 'max-w-md');
        }

        messageWrapper.appendChild(messageBox);
        chatContainer.appendChild(messageWrapper);

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = 'flex justify-start w-full';

        const box = document.createElement('div');
        box.className = 'bg-gray-200 text-gray-500 p-3 rounded-lg rounded-tr-none flex items-center gap-2';
        box.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> يكتب الآن...';

        wrapper.appendChild(box);
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return id;
    }

    function removeLoadingIndicator(id) {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
        }
    }
});
