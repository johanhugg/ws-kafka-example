// Create a new WebSocket instance
let socket = new WebSocket("ws://localhost:8080");
const button = document.getElementById("submitButton");

// Handle WebSocket events
const onOpen = () => {
  button.removeAttribute("disabled");
  console.log("Connected to WebSocket server");
};

const onMessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received message from server:", data);

  if (data.type === "message") {
    // Add the message to the messages div
    const messagesDiv = document.getElementById("messages");
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = data.message;
    messagesDiv.appendChild(messageDiv);
  }
};

const onError = (error) => {
  console.info(`WebSocket error:`, error);
};

const onClose = () => {
  console.log("Disconnected from WebSocket server");
  button.setAttribute("disabled", "disabled");

  // Automatically reconnect to the server after a 5-second delay
  setTimeout(() => {
    console.log("Trying to reconnect to WebSocket server");
    socket = new WebSocket("ws://localhost:8080");
    // Attach event listeners to the new WebSocket instance
    socket.onopen = onOpen;
    socket.onclose = onClose;
    socket.onmessage = onMessage;
    socket.onerror = onError;
  }, 5000);
};

// Attach event listeners to the initial WebSocket instance
socket.onopen = onOpen;
socket.onclose = onClose;
socket.onmessage = onMessage;
socket.onerror = onError;

// Listen for submit events on the publish form
const publishForm = document.getElementById("publishForm");
publishForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Get the topic and message from the form
  const topicInput = document.getElementById("topicInput");
  const topic = topicInput.value;
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value;

  // Send a publish message to the server
  socket.send(
    JSON.stringify({
      type: "publish",
      topic: topic,
      message: message,
    })
  );
});
