let locationData = null;

function getUserLocationAndLog() {
  return fetch('https://api.ipdata.co?api-key=2f97b73b328e4407f0f3253b801a7cc3df90027ad0d7dc5e043074fd')
    .then(response => response.json())
    .then(location => {
      console.log('Location data received:', location);
      locationData = JSON.stringify(location);
      return sendToGAS(locationData, false); // Send location data to GAS
    });
}

function sendInputToGAS3(message, isUserMessage) {
    const GAS_URL3 = 'https://script.google.com/macros/s/AKfycbwe-yTPhnrec7w5kunfqOxTlIjbrGwngi6KezinzGcY1Pqciz9n0mwWJQfXGxfGW4ic/exec'; // Replace with your actual URL
    const queryParams = `?message=${encodeURIComponent(message)}&isUserMessage=${isUserMessage}`;

    fetch(GAS_URL3 + queryParams, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(() => {
        console.log("Input sent to Google Sheet via GAS_URL3");
    })
    .catch(error => {
        console.error("Error sending input to GAS_URL3:", error);
    });
}

function toggleChatbot() {
    var chatWidget = document.getElementById("chat-widget");
    if (chatWidget.style.display === "none") {
        chatWidget.style.display = "flex";
        localStorage.setItem('chatbotOpen', 'true');
    } else {
        chatWidget.style.display = "none";
      chatWidget.style.zIndex = "0";  // Set z-index to 0 when not visible
        localStorage.setItem('chatbotOpen', 'false');
    }
}

document.getElementById("chatbot-toggle").addEventListener("click", toggleChatbot);
const closeButton = document.getElementById('chatbot-close');
const chatWidget = document.getElementById('chat-widget');

closeButton.addEventListener('click', () => {
    chatWidget.style.display = 'none';
});



let currentThreadId = null;

function startConversation() {
    fetch('https://aiwebsitechatbots-samuelsicking.replit.app/start', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        currentThreadId = data.thread_id;
        console.log("New conversation started with thread ID:", currentThreadId);
    })
    .catch(error => console.error('Error starting conversation:', error));
}

function createLoadingElement() {
    let loadingElement = document.createElement('div');
    loadingElement.className = 'loading-dots';
    for (let i = 0; i < 3; i++) {
        let dot = document.createElement('div');
        loadingElement.appendChild(dot);
    }
    return loadingElement;
}

function displayChatbotMessage(message) {
    let chatbox = document.getElementById('chatbox');
    let messageElement = document.createElement('p');
    messageElement.className = 'chat-assistant';
    messageElement.textContent = message;
    chatbox.appendChild(messageElement);
    
    saveChatbotState();
   // Only log the message if it's not the introductory message
    if (message !== "Hi, how can I help you?") {
        console.log("Chatbot:", message); // Log the message
    }
}


function displayUserMessage(message) {
    let chatbox = document.getElementById('chatbox');
    let userElement = document.createElement('p');
    userElement.className = 'chat-user';
    userElement.textContent = message;
    chatbox.appendChild(userElement);
    saveChatbotState();
  console.log("User:", message); // Log the user message
}

document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let userMessage = document.getElementById('chat-input').value;

    if (!userMessage.trim()) {
        alert("Please enter a message.");
        return;
    }

    document.getElementById('messagebtn').disabled = true;
    displayUserMessage(userMessage);
    document.getElementById('chat-input').value = '';
    let loadingElement = createLoadingElement();
    document.getElementById('chatbox').appendChild(loadingElement);
       sendInputToGAS3(userMessage, true);
    fetch('https://aiwebsitechatbots-samuelsicking.replit.app/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            thread_id: currentThreadId,  
            message: userMessage 
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('messagebtn').disabled = false;
        let loadingElement = document.querySelector('.loading-dots');
        if (loadingElement) document.getElementById('chatbox').removeChild(loadingElement);
        displayChatbotMessage(removeSourceToken(data.response));
       let chatbotResponse = data.response; // Assuming 'data.response' contains the chatbot's response
        sendToGAS(chatbotResponse, false); // Send chatbot response to GAS
        document.getElementById('chat-input').value = '';
        document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

function removeSourceToken(text) {
    return text.replace(/【.*?】/g, '');
}

function saveChatbotState() {
    const state = {
        currentThreadId: currentThreadId,
        messages: document.getElementById('chatbox').innerHTML
    };
    localStorage.setItem('chatbotState', JSON.stringify(state));
}

function clearChatbotState() {
    localStorage.removeItem('chatbotState');
    document.getElementById('chatbox').innerHTML = '';
}

window.onload = function() {
  let chatWidget = document.getElementById('chat-widget');

    let chatbox = document.getElementById('chatbox');

  
  
    if (!sessionStorage.getItem('isNewTab')) {
        clearChatbotState();
        sessionStorage.setItem('isNewTab', 'true');
        startNewConversation();
    } else {
        let savedState = localStorage.getItem('chatbotState');
        if (savedState) {
            let state = JSON.parse(savedState);
            currentThreadId = state.currentThreadId;
            chatbox.innerHTML = state.messages;
        } else {
            startNewConversation();
        }
    }
  
//     let chatbotState = localStorage.getItem('chatbotOpen');

//     if (chatbotState === 'true') {
//         chatWidget.style.display = 'flex';
//     } else {
//         chatWidget.style.display = 'none';
//     }
  


};


function startNewConversation() {
    startConversation();
    let chatbox = document.getElementById('chatbox');
    let loadingElement = createLoadingElement();
    chatbox.appendChild(loadingElement);

    setTimeout(function() {
        chatbox.removeChild(loadingElement);
        displayChatbotMessage("Hi, how can I help you?");
    }, 2000);
}






document.getElementById('messagebtn').addEventListener('click', function() {
    var message = document.getElementById('chat-input').value;
    if (!message.trim()) {
        alert("Please enter a message.");
        return;
    }

    getUserLocationAndLog().then(() => {
        sendToGAS(message, true); // Send user message to GAS after fetching location
    }).catch(error => {
        console.error("Error in fetching location or sending message:", error);
    });
});



function sendToGAS(message, isUserMessage) {
    var GAS_URL = 'https://script.google.com/macros/s/AKfycbwGH08QE5iArgumhgv4e0JFfQaDZZLAuaq_I62q6JVKNTxg9aGjDRcssCpCvAuTjKKWww/exec';
    var queryParams = `?message=${encodeURIComponent(message)}&isUserMessage=${isUserMessage}`;
    if (locationData) {
        queryParams += `&locationData=${encodeURIComponent(locationData)}`;
    }

    fetch(GAS_URL + queryParams, {
        method: 'POST', // Specify the method
        mode: 'no-cors', // Add this line to set the request mode to 'no-cors'
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(() => {
        console.log("Message sent to Google Sheet");
    })
    .catch(error => {
        console.error("Error sending message:", error);
    });
}




// Call this function with `true` for user messages and `false` for chatbot responses


window.addEventListener('DOMContentLoaded', (event) => {
  const chatInput = document.getElementById('chat-input');
  const initialText = 'Ask a question';

  chatInput.addEventListener('focus', function() {
    if (chatInput.value === initialText) {
      chatInput.value = '';
    }
  });

  chatInput.addEventListener('blur', function() {
    if (chatInput.value === '') {
      chatInput.value = initialText;
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  var bookingLink = document.querySelector('.tour-booking a');
  var chatbotContainer = document.getElementById('chat-widget');
  var calendlyContainer = document.getElementById('calendly-widget-container');
  var backButton = document.getElementById('back-to-chatbot');
  var chatbotToggle = document.getElementById('chatbot-toggle');

  bookingLink.addEventListener('click', function(event) {
    event.preventDefault();
    chatbotContainer.style.display = 'none';
    calendlyContainer.style.display = 'block';
    chatbotToggle.style.display = 'none'; // Ensure the toggle button is visible
  });

  backButton.addEventListener('click', function() {
    calendlyContainer.style.display = 'none';
    chatbotContainer.style.display = 'flex'; // Change this to 'flex' to match your CSS
    chatbotToggle.style.display = 'flex'; // Ensure the toggle button is visible
  });
});


// Your Google Apps Script web app URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxl7Hd3IJagAZmK09D05unk1FLck1R7PvIKH6I3PUgvSOhdxXpMlGvuk1koIUpvFPNy4A/exec';

// Retrieve the stored count from local storage or initialize to 0
let count = localStorage.getItem('buttonPressCount') || 0;
const countDisplay = document.getElementById('count');
countDisplay.textContent = count;

document.getElementById("btn").addEventListener("click", btnClicked);

function btnClicked() {
  document.getElementById("buttontext").innerHTML = '<span style="color: black;">Thanks for your response!</span>';

  // Increment the click counter and update the display
  count++;
  localStorage.setItem('buttonPressCount', count);
  countDisplay.textContent = count;

  // Send a request to the Google Apps Script web app
  fetch(GAS_URL + '?button=1');
}

// Your Google Apps Script web app URL
const GAS_URL2 = 'https://script.google.com/macros/s/AKfycbzIiQhU9Y_c_3_n1lhyeprUc7g-CnK4-L0_BeJCcPA4RqmFhsMLG3-_TlkiZxtE0hhO/exec';

// Retrieve the stored count from local storage or initialize to 0
let count2 = localStorage.getItem('buttonPressCount2') || 0;
const count2Display = document.getElementById('count2');
count2Display.textContent = count2;
document.getElementById("btn2").addEventListener("click", btn2Clicked);

function btn2Clicked() {
  document.getElementById("buttontext").innerHTML = '<span style="color:black;">Thanks for your response!</span>';

  // Increment the click counter and update the display
  count2++;
  localStorage.setItem('buttonPressCount2', count2);
  count2Display.textContent = count2;

  // Send a request to the Google Apps Script web app
  fetch(GAS_URL2 + '?button=1');
}