// server.js

const express = require('express');
const SocketServer = require('ws').Server;
const uuid = require('uuid')

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

function postMessage(message) {
  // Add a uuid to the message
  message.id = uuid.v4();
  // Update the message type so it can be correctly broadcast as an incoming message
  message.type = "incomingMessage";
  console.log(`User ${message.username} said ${message.content}`);
  // Send the message to all connected clients
  wss.broadcast(JSON.stringify(message));
}

function postNotification(message) {
  // Add a uuid to the message
  message.id = uuid.v4();
  message.type = "incomingNotification";
  // Send the notification to all connected clients
  wss.broadcast(JSON.stringify(message));
}

function userCountChanged() {
  const userCount = wss.clients.length;
  wss.broadcast(JSON.stringify({type: "userCountChanged", userCount: userCount}));
}

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Notify all clients that there is one more user.
  userCountChanged()

  ws.on('close', () => {
    console.log('Client disconnected');
    // Notify all clients that there is one less user.
    userCountChanged()
  });
  ws.on('message', (data) => {
    // Parse the incoming messages
    const message = JSON.parse(data);
    switch(message.type) {
      case "postMessage":
        postMessage(message);
        break;
      case "postNotification":
        postNotification(message)
        break;
      default:
        throw new Error("Unknown incoming message " + message.type);
    }
  });
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};