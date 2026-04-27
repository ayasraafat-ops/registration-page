document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInputElement = document.getElementById('user-input');
  const chatContainer = document.getElementById('chat-container');
  const sendButton = document.getElementById('send-button');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInputElement.value.trim();
    if (!message) return;

    // Clear input and disable button
    userInputElement.value = '';
    sendButton.disabled = true;

    // Append user message (Right-to-Left, user starts on the right, but in arabic RTL user messages usually align left to differentiate, Wait let's follow memory: "user messages should be aligned to the left (e.g., using Tailwind 'justify-end' in a flex container) and assistant messages aligned to the right (e.g., using 'justify-start')")
    appendMessage('user', message);

    // Add loading indicator
    const loadingElement = addLoadingIndicator();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      // Remove loading indicator
      loadingElement.remove();

      if (response.ok) {
        appendMessage('assistant', data.reply);
      } else {
        appendMessage('system', data.error || 'حدث خطأ أثناء الاتصال بالخادم.');
      }
    } catch (error) {
      console.error('Error:', error);
      loadingElement.remove();
      appendMessage('system', 'حدث خطأ في الشبكة.');
    } finally {
      sendButton.disabled = false;
      userInputElement.focus();
    }
  });

  function appendMessage(role, text) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex';

    if (role === 'user') {
      wrapperDiv.classList.add('justify-end'); // Left in RTL
    } else {
      wrapperDiv.classList.add('justify-start'); // Right in RTL
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'p-3 rounded-lg max-w-[80%] shadow-sm';

    // Prevent XSS using textContent and style appropriately
    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.textContent = text;

    if (role === 'user') {
      messageDiv.classList.add('bg-indigo-600', 'text-white', 'rounded-tl-none');
    } else if (role === 'assistant') {
      messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'rounded-tr-none');
    } else {
      messageDiv.classList.add('bg-red-100', 'text-red-800', 'rounded-md');
    }

    wrapperDiv.appendChild(messageDiv);
    chatContainer.appendChild(wrapperDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function addLoadingIndicator() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex justify-start'; // Align right in RTL

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-gray-200 p-3 rounded-lg rounded-tr-none shadow-sm flex items-center space-x-2 space-x-reverse';

    // Simple animated dots
    loadingDiv.innerHTML = `
      <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
      <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
      <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
    `;

    wrapperDiv.appendChild(loadingDiv);
    chatContainer.appendChild(wrapperDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapperDiv;
  }
});
