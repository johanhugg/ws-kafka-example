# ws-kafka-example
An example project showing how to use websockets in a frontend, connecting to a backend and passing messages through kafka

# Frontend
Connects to the backend using websockets, send a message on a specified topic, with a message
The backend will send the same message back to the frontend
All messages on the topic, from different clients will be broadcast to all websocket clients

# Backend
Starts a consumer for each ws client, and send back the message to all clients.
The backend keeps track of all clients, giving them a unique id.

# TODO

* The frontend doesn't handle disconnecting and reconnecting automatically
* The backend should only send the message back to the original client, and not broadcast
