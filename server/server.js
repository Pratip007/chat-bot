// Remove dotenv config temporarily
// require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const authController = require('./src/controllers/authController');
const processMessage = require('./src/controllers/chatController').processMessage;
const connectDB = require('./src/config/db');

const app = express();
const server = http.createServer(app);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.post('/api/user', authController.getUser);
app.post('/api/chat', upload.single('file'), authController.handleChat);
app.get('/api/chat/history', authController.getChatHistory);

// Basic route
app.get('/', (req, res) => {
    res.send('Chatbot API is running');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (sessionId) => {
    socket.join(sessionId);
    console.log(`Client joined room: ${sessionId}`);
  });

  socket.on('sendMessage', async (message) => {
    try {
      console.log('Received message:', message);
      // Call your bot logic
      const botResponse = await processMessage({
        text: message.text,
        sessionId: message.sessionId,
        userId: message.userId
      });
      // Add sender: 'bot' for the client UI
      botResponse.sender = 'bot';
      // Emit the bot's response to the client
      io.to(message.sessionId).emit('message', botResponse);
      console.log('Sent bot response:', botResponse);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

// Port configuration
const PORT = 5000;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 