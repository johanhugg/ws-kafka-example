// Define a function for handling the closing of the WebSocket connection
const handleClose = (ws) => {
  ws.onclose = (event) => {
    console.log("WebSocket connection closed");
    // Check the ready state of the WebSocket connection
    if (ws.readyState === WebSocket.CLOSED) {
      // Attempt to reconnect to the server
      const newWs = new WebSocket("ws://localhost:8080");

      // Attach the onclose event handler to the new WebSocket instance
      handleClose(newWs);

      // Copy the onmessage event handler from the old WebSocket instance to the new one
      newWs.onmessage = ws.onmessage;

      // Replace the old WebSocket instance with the new one
      window.ws = newWs;
      console.log("WebSocket connection re-established");
    }
  };
};

// Connect to the WebSocket server
const ws = new WebSocket("ws://localhost:8080");
// Make the ws variable available in the global scope
window.ws = ws;

// Listen for messages from the server
ws.onmessage = (event) => {
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

// Attach the onclose event handler to the WebSocket instance
handleClose(ws);
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
  ws.send(
    JSON.stringify({
      type: "publish",
      topic: topic,
      message: message,
    })
  );
});
