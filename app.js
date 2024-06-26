const WebSocket = require("ws");
const express = require("express");
const http = require("http"); // Use https for secure WebSocket
const helmet = require("helmet");
const fs = require("fs"); // Required for reading SSL/TLS certificates
const app = express();
// Load SSL/TLS certificates
//const privateKey = fs.readFileSync('../etc/pki/tls/certs/localhost.crt', 'utf8');
//const certificate = fs.readFileSync('../etc/pki/tls/certs/localhost.crt', 'utf8');
//const credentials = { key: privateKey, cert: certificate };
// Create HTTPS server with Express app and credentials
const server = http.createServer(app);
// Configure WebSocket server (wss) to use the HTTPS server
const wss = new WebSocket.Server({ server });
// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("New client connected");
  // Handle messages from clients
  ws.on("message", (message) => {
    console.log(`Received message => ${message}`);
    // Parse the message as JSON
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error("Invalid JSON:", message);
      return;
    }
    // Determine message type and handle accordingly
    switch (data.type) {
      case "offer":
        broadcast(message, ws);
        console.log("Offer message broadcasted");
        break;
      case "answer":
        // Broadcast SDP offer/answer messages to other clients
        broadcast(message, ws);
        console.log("Answer message broadcasted");
        break;
      case "candidate":
        // Broadcast ICE candidate messages to other clients
        broadcast(message, ws);
        console.log("Candidate message broadcasted");
        break;
      default:
        console.log("Unknown message type:", data.type);
        break;
    }
  });
  // Handle client disconnection
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
// Function to broadcast messages to all clients except sender
function broadcast(message, sender) {
  wss.clients.forEach((client) => {
    //console.log('client: ',client);
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
      //console.log('client: ',client);
    }
  });
}
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "'wss://16.171.111.128'"], // Adjust this to your WebSocket server URL
        // Add other directives as needed
      },
    },
  })
);
// Start the HTTPS server
const PORT = process.env.PORT || 443;
server.listen(PORT, () => {
  console.log(`WebSocket signaling server running on port ${PORT}`);
});
