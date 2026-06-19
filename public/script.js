document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');

    // Conversation history state
    let messages = [
        { role: "system", content: "أنت مساعد ذكي ومفيد. أجب باللغة العربية دائماً وبطريقة احترافية وودودة." }
    ];

    function appendMessage(role, text, isError = false) {
        const wrapper = document.createElement('div');
        // In RTL layout: user messages are on the right (justify-start in RTL flexbox visually puts it on the right side),
        // but typically user is start (right) and assistant is end (left) in standard chat apps.
        // Tailwind `justify-start` pushes to the logical start (which is right in RTL).
        // Let's make user message justify-start (right) and assistant justify-end (left).
        wrapper.className = `flex ${role === 'user' ? 'justify-start' : 'justify-end'}`;

        const bubble = document.createElement('div');
        bubble.className = `rounded-lg py-2 px-4 max-w-[80%] shadow-sm whitespace-pre-wrap ${
            role === 'user'
                ? 'bg-blue-600 text-white'
                : (isError ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-gray-200 text-gray-800')
        }`;

        // Prevent XSS
        bubble.textContent = text;

        wrapper.appendChild(bubble);
        chatBox.appendChild(wrapper);

        // Scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function setLoading(isLoading) {
        messageInput.disabled = isLoading;
        sendBtn.disabled = isLoading;
        if (isLoading) {
            sendBtn.innerHTML = '<span class="animate-pulse">...</span>';
        } else {
            sendBtn.textContent = 'إرسال';
            messageInput.focus();
        }
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = messageInput.value.trim();
        if (!text) return;

        // Clear input
        messageInput.value = '';

        // Add user message to UI and state
        appendMessage('user', text);
        messages.push({ role: "user", content: text });

        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
                throw new Error(`خطأ في الخادم: ${errorMsg}`);
            }

            const aiMessage = data.choices[0].message.content;

            // Add AI message to UI and state
            appendMessage('assistant', aiMessage);
            messages.push({ role: "assistant", content: aiMessage });

        } catch (error) {
            console.error('Error fetching chat response:', error);
            appendMessage('assistant', `عذراً، حدث خطأ أثناء الاتصال بالخادم. التفاصيل: ${error.message}`, true);
            // Optionally remove the last user message from state if we want them to retry cleanly
            messages.pop();
        } finally {
            setLoading(false);
        }
    });
});
