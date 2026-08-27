const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let conversationHistory = [];

function appendMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

  const bubble = document.createElement('div');
  bubble.className = `p-3 rounded-lg shadow-sm max-w-[80%] whitespace-pre-wrap ${role === 'user' ? 'bg-blue-600 text-white' : role === 'error' ? 'bg-red-200 text-red-900' : 'bg-gray-200 text-gray-800'}`;

  // Use textContent to prevent XSS
  bubble.textContent = content;

  wrapper.appendChild(bubble);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
  const wrapper = document.createElement('div');
  wrapper.id = 'loading-indicator';
  wrapper.className = 'flex justify-start';

  const bubble = document.createElement('div');
  bubble.className = 'p-3 rounded-lg shadow-sm max-w-[80%] bg-gray-200 text-gray-800 italic';
  bubble.textContent = 'جاري التفكير...';

  wrapper.appendChild(bubble);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || sendButton.disabled) return;

  userInput.value = '';
  sendButton.disabled = true;

  appendMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });

  showLoading();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();
    removeLoading();

    if (!response.ok) {
      const errorMessage = data.error && data.error.message ? data.error.message : 'حدث خطأ غير معروف';
      appendMessage('error', `Error: ${errorMessage}`);
    } else if (data.choices && data.choices.length > 0) {
      const aiResponse = data.choices[0].message.content;
      appendMessage('assistant', aiResponse);
      conversationHistory.push({ role: 'assistant', content: aiResponse });
    } else {
      appendMessage('error', 'تنسيق استجابة غير صالح من الخادم.');
    }
  } catch (error) {
    removeLoading();
    appendMessage('error', `Network Error: ${error.message}`);
  } finally {
    sendButton.disabled = false;
    userInput.focus();
  }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});
