const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to specific domains
    methods: ['GET', 'POST']
  }
});

// Store room state (simple in-memory for this MVP)
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle joining a room (for discovery)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // Notify others in room that a new peer joined
    socket.to(roomId).emit('peer-joined', { peerId: socket.id });
  });

  // WebRTC Signaling Events
  socket.on('offer', ({ target, offer }) => {
    io.to(target).emit('offer', { sender: socket.id, offer });
  });

  socket.on('answer', ({ target, answer }) => {
    io.to(target).emit('answer', { sender: socket.id, answer });
  });

  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', { sender: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Optional: Notify rooms this socket was in
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Realtime service running on port ${PORT}`);
});
