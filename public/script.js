document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInputField = document.getElementById('user-input');
    const chatContainer = document.getElementById('chat-container');
    const errorContainer = document.getElementById('error-container');
    const sendButton = document.getElementById('send-button');

    // Conversation history to send to backend
    let conversationHistory = [];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userText = userInputField.value.trim();
        if (!userText) return;

        // Clear previous error
        hideError();

        // 1. Add User Message to UI and History
        appendMessage(userText, 'user');
        conversationHistory.push({ role: "user", content: userText });

        userInputField.value = '';
        setLoadingState(true);

        // 2. Add temporary loading indicator
        const loadingId = appendLoadingIndicator();

        try {
            // 3. Send request to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            // Remove loading indicator
            removeElement(loadingId);

            if (!response.ok) {
                const errorMsg = data.error?.message || response.statusText || 'حدث خطأ غير معروف.';
                showError(`خطأ في الخادم: ${errorMsg}`);
                return;
            }

            if (data.choices && data.choices.length > 0) {
                const aiResponseText = data.choices[0].message.content;

                // 4. Add AI Message to UI and History
                appendMessage(aiResponseText, 'assistant');
                conversationHistory.push({ role: "assistant", content: aiResponseText });
            } else {
                showError("استجابة غير متوقعة من الخادم.");
            }

        } catch (error) {
            removeElement(loadingId);
            showError(`خطأ في الاتصال: ${error.message}`);
        } finally {
            setLoadingState(false);
            userInputField.focus();
        }
    });

    function appendMessage(text, role) {
        // Create main wrapper
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'flex w-full';

        // RTL alignment logic: User right (start), AI left (end)
        // Since dir="rtl", justify-start aligns to right, justify-end aligns to left
        if (role === 'user') {
            messageWrapper.classList.add('justify-start');
        } else {
            messageWrapper.classList.add('justify-end');
        }

        // Create inner box
        const messageBox = document.createElement('div');
        messageBox.className = 'rounded-lg p-3 shadow max-w-[80%] md:max-w-[70%] ';

        if (role === 'user') {
            messageBox.classList.add('bg-blue-100', 'border', 'border-blue-200');
        } else {
            messageBox.classList.add('bg-white', 'border', 'border-gray-200');
        }

        // Create text element
        const messageText = document.createElement('p');
        messageText.className = 'text-gray-800 whitespace-pre-wrap';

        // Use textContent to protect against XSS
        messageText.textContent = text;

        // Assemble and append
        messageBox.appendChild(messageText);
        messageWrapper.appendChild(messageBox);
        chatContainer.appendChild(messageWrapper);

        scrollToBottom();
    }

    function appendLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = 'flex justify-end w-full'; // Align left in RTL

        const box = document.createElement('div');
        box.className = 'bg-gray-200 rounded-lg p-3 shadow flex items-center gap-2';

        // Typing animation using tailwind classes
        box.innerHTML = `
            <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        `;

        wrapper.appendChild(box);
        chatContainer.appendChild(wrapper);
        scrollToBottom();
        return id;
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
        }
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function setLoadingState(isLoading) {
        userInputField.disabled = isLoading;
        sendButton.disabled = isLoading;
        if (isLoading) {
            sendButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        console.error(message);
    }

    function hideError() {
        errorContainer.textContent = '';
        errorContainer.classList.add('hidden');
    }
});