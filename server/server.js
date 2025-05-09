require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { protect, admin } = require('./src/middleware/auth');
const authController = require('./src/controllers/authController');
const processMessage = require('./src/controllers/chatController').processMessage;

const app = express();
const server = http.createServer(app);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// MongoDB connection with retry logic
const connectWithRetry = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatbot';
    console.log('Attempting to connect to MongoDB at:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000 // Increased timeout to 10 seconds
    });
    
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Message Schema
const messageSchema = new mongoose.Schema({
  userId: String,
  content: String,
  attachments: [String],
  timestamp: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);

// Authentication routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

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

// Protected routes
app.get('/api/messages/:userId', protect, async (req, res) => {
  try {
    console.log('Fetching messages for user:', req.params.userId);
    const messages = await Message.find({ userId: req.params.userId })
      .sort({ timestamp: 1 });
    console.log('Found messages:', messages);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Admin routes
app.get('/api/admin/messages', protect, admin, async (req, res) => {
  try {
    console.log('Fetching all messages for admin');
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(100);
    console.log('Found messages:', messages);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

app.post('/api/admin/reply', protect, admin, async (req, res) => {
  try {
    const { userId, content } = req.body;
    console.log('Admin reply request:', { userId, content });
    
    const message = new Message({
      userId,
      content,
      timestamp: new Date(),
      isAdmin: true
    });

    await message.save();
    console.log('Saved admin reply:', message);
    
    // Emit to specific user's room
    io.to(userId).emit('message', message);
    // Also emit to admin room
    io.emit('message', message);
    
    res.json(message);
  } catch (error) {
    console.error('Error sending admin reply:', error);
    res.status(500).json({ error: 'Error sending reply' });
  }
});

app.get('/api/admin/download/:fileId', async (req, res) => {
  try {
    const message = await Message.findOne({ 'file._id': req.params.fileId });
    if (!message || !message.file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', message.file.type);
    res.setHeader('Content-Disposition', `attachment; filename="${message.file.name}"`);
    res.send(message.file.data);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Error downloading file' });
  }
});

// Port configuration with fallback
const PORT = process.env.PORT || 5002;

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
};

// Server startup with error handling
const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    server.listen(availablePort, () => {
      console.log(`Server running on port ${availablePort}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer(); 