// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// In-memory status storage (use Redis/Database for production)
const addressStatuses = new Map();

// REST endpoint for status updates
app.post('/api/status', (req, res) => {
  const { addressId, status, teamId, timestamp } = req.body;
  
  addressStatuses.set(addressId, {
    status,
    teamId,
    timestamp: timestamp || new Date().toISOString()
  });

  // Broadcast to all connected clients
  io.emit('status_updated', { addressId, status, teamId, timestamp });
  
  res.json({ success: true });
});

// Get current status for addresses
app.post('/api/statuses', (req, res) => {
  const { addressIds } = req.body;
  const statuses = {};
  
  addressIds.forEach(id => {
    if (addressStatuses.has(id)) {
      statuses[id] = addressStatuses.get(id);
    }
  });
  
  res.json(statuses);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Team member connected:', socket.id);
  
  socket.on('join_area', (areaId) => {
    socket.join(areaId);
    console.log(`User joined area: ${areaId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Team member disconnected:', socket.id);
  });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
