// Create context memory
function createMemory(messages) {
    const memory = [];
    for (const msg of messages) {
        memory.push({ role: msg.role, content: msg.content });
    }
    return memory;
}

// send messages
async function sendMessage() {
    const inputElement = document.getElementById('user-input');
    const userInput = inputElement.value.trim();

    if (userInput !== '') {
        showMessage("Guest", userInput);
        chatMemory = await getChatGPTResponse(userInput, chatMemory);
        inputElement.value = '';
    }
}

// show messages in chat div
function showMessage(sender, message) {
    const chatContainer = document.getElementById('chat-container');
    const chatSection = document.querySelector('.chathistory');
    const typingIndicator = document.getElementById('typing-indicator');

    // Remove "typing..." on answer arrival
    if (typingIndicator && sender === 'GPT') {
        chatContainer.removeChild(typingIndicator);
    }

    // create new message
    const messageElement = document.createElement('div');
    messageElement.innerText = `${sender}: ${message}`;

    // ads a class according to the sender
    if (sender === 'Guest') {
        messageElement.classList.add('user-message');
    } else if (sender === 'GPT') {
        messageElement.classList.add('chatgpt-message');

        // message copy
        const copyLink = document.createElement('button');
        copyLink.innerText = 'Copy';
        copyLink.style.float = 'right';
        copyLink.addEventListener('click', function (event) {
            event.preventDefault();
            const text = message;
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
        });

        messageElement.appendChild(copyLink);
        
    }

    chatContainer.appendChild(messageElement);
    chatSection.scrollTop = chatSection.scrollHeight;
}

// fetches the answer
async function getChatGPTResponse(userInput, chatMemory = []) {
    const chatContainer = document.getElementById('chat-container');

    const typingIndicator = document.createElement('p');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.textContent = 'Typing...';
    chatContainer.appendChild(typingIndicator);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer yourapikeyhere'
            },
            body: JSON.stringify({
                "model": "gpt-3.5-turbo",
                "messages": [
                    ...chatMemory,
                    {"role": "user", "content": userInput}
                ]
            })
        });

        if (!response.ok) {
            throw new Error('Error in the request to\'API');
        }

        const data = await response.json();

        if (!data.choices || !data.choices.length || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('Invalid API request');
        }

        const chatGPTResponse = data.choices[0].message.content.trim();
        var cleanResponse = chatGPTResponse.replace(/(```html|```css|```javascript|```php|```python)(.*?)/gs, '$2');
        cleanResponse = cleanResponse.replace(/```/g, "");
        showMessage("GPT", cleanResponse);

        // pushes the answer into context memory array
        chatMemory.push({ role: 'user', content: userInput });
        chatMemory.push({ role: 'assistant', content: cleanResponse });

        // returns updated context memory array
        return chatMemory;
    } catch (error) {
        console.error(error);
        // .
    }
}



// initialization
let chatMemory = createMemory([
    { role: 'system', content: "You are a full stack developer working for a Web Agency. You are specialized in producing code for websites and you will always provide clean and effective code. When asked for some code, you will also provide the description for  different approaches to achieve the same goal. You will always end your answers with a greeting and thanking for the question received." }
]);


