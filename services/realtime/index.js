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

  // Pairing Handshake
  socket.on('pairing-request', ({ targetId }) => {
    // Check if target exists
    const targetSocket = io.sockets.sockets.get(targetId);
    if (targetSocket) {
      console.log(`Pairing request: ${socket.id} -> ${targetId}`);
      io.to(targetId).emit('pairing-request', { requesterId: socket.id });
    } else {
      socket.emit('pairing-error', { message: 'Target device not found' });
    }
  });

  socket.on('pairing-response', ({ targetId, accepted }) => {
    console.log(`Pairing response from ${socket.id} to ${targetId}: ${accepted}`);
    io.to(targetId).emit('pairing-response', { responderId: socket.id, accepted });
  });

  // File Transfer Request (Metadata)
  socket.on('transfer-request', ({ targetId, file }) => {
    console.log(`Transfer request: ${socket.id} -> ${targetId} (${file.name})`);
    io.to(targetId).emit('transfer-request', { senderId: socket.id, file });
  });

  // File Transfer Data Relay
  socket.on('transfer-accepted', ({ targetId, fileId }) => {
    console.log(`Transfer accepted by ${socket.id} for ${targetId}`);
    io.to(targetId).emit('transfer-accepted', { responderId: socket.id, fileId });
  });

  socket.on('file-chunk', ({ targetId, chunk, chunkIndex, totalChunks }) => {
    // Relay chunk directly to target (optimize in prod: use binary streams)
    io.to(targetId).emit('file-chunk', { chunk, chunkIndex, totalChunks });
  });

  socket.on('transfer-complete', ({ targetId }) => {
    console.log(`Transfer complete to ${targetId}`);
    io.to(targetId).emit('transfer-complete', { senderId: socket.id });
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
