// Simple WebSocket stub (CommonJS) to broadcast simulated destination updates.
// Run with: `node dev-scripts\ws-stub.cjs` (install `ws` first: `npm i ws`)
const WebSocket = require("ws");

const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 8082;
// bind to all interfaces so phones on the LAN can connect
const wss = new WebSocket.Server({ host: '0.0.0.0', port });
const destinations = ["D-001", "D-002", "D-003", "D-004", "D-005"];

function broadcast(msg) {
  const str = JSON.stringify(msg);
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(str);
  });
}

wss.on("connection", (ws, req) => {
  // Try to determine the remote IP address of the connecting client
  const addr = (req && req.socket && req.socket.remoteAddress) || (ws._socket && ws._socket.remoteAddress) || "unknown";
  console.log(`client connected from ${addr} (clients: ${wss.clients.size})`);
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

  ws.on("close", () => {
    clearInterval(id);
    console.log(`client disconnected from ${addr} (clients: ${wss.clients.size})`);
    // if this socket had a clientId associated, broadcast a client-stop so others remove the marker
    try {
      const cid = ws._clientId;
      if (cid) {
        const stopMsg = { type: 'client-stop', clientId: cid, from: addr };
        broadcast(stopMsg);
        console.log(`client-stop from ${addr}: ${cid}`);
      }
    } catch (e) {}
  });
  
  ws.on("message", (message) => {
    try {
      const msg = typeof message === 'string' ? JSON.parse(message) : JSON.parse(message.toString());
      if (!msg || !msg.type) return;
      // remember last clientId seen on this socket (if any)
      if (msg.clientId) ws._clientId = msg.clientId;

      if (msg.type === 'client-position') {
        // annotate with sender addr
        msg.from = addr;
        // rebroadcast to all clients
        broadcast(msg);
        // log small summary
        console.log(`client-position from ${addr}: ${msg.clientId} ${msg.lat},${msg.lng}`);
      } else if (msg.type === 'client-register' || msg.type === 'client-hello') {
        // announce registration/hello to others
        msg.from = addr;
        broadcast(msg);
        console.log(`${msg.type} from ${addr}: ${msg.clientId}`);
      } else if (msg.type === 'client-stop') {
        // client explicitly requested stop: broadcast so others remove marker
        msg.from = addr;
        broadcast(msg);
        console.log(`client-stop from ${addr}: ${msg.clientId}`);
      }
    } catch (e) {
      // ignore malformed messages
    }
  });
});

console.log(`WS stub listening on ws://0.0.0.0:${port} (accessible via your machine IP)`);
