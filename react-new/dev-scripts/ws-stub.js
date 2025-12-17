// Simple WebSocket stub to broadcast simulated destination updates.
// Run with: `node dev-scripts/ws-stub.js` (install `ws` first: `npm i ws`)
const WebSocket = require("ws");

const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 8082;
const wss = new WebSocket.Server({ port });
const destinations = ["D-001", "D-002", "D-003", "D-004", "D-005"];

function broadcast(msg) {
  const str = JSON.stringify(msg);
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(str);
  });
}

wss.on("connection", (ws) => {
  console.log("client connected");
  ws.on('message', (msg) => {
    // echo/broadcast any incoming client messages to all clients
    try {
      const parsed = typeof msg === 'string' ? JSON.parse(msg) : JSON.parse(msg.toString());
      // broadcast the same object to everyone
      broadcast(parsed);
    } catch (e) {
      // if not JSON, broadcast raw
      broadcast({ type: 'raw', data: msg.toString() });
    }
  });
  const id = setInterval(() => {
    const d = destinations[Math.floor(Math.random() * destinations.length)];
    if (Math.random() > 0.5) {
      // destination metric update
      broadcast({
        type: "destination-update",
        id: d,
        payload: {
          availableTrucks: Math.floor(Math.random() * 20),
          tripsPerWeek: Math.floor(Math.random() * 30),
        },
      });
    } else {
      // position update (jitter around a base point)
      const lat = 30 + Math.random() * 20;
      const lng = -115 + Math.random() * 40;
      broadcast({ type: "position-update", id: d, lat, lng });
    }
  }, 3500);

  ws.on("close", () => clearInterval(id));
});

console.log(`WS stub listening on ws://localhost:${port}`);
