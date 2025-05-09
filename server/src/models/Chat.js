const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
});

module.exports = mongoose.model('Chat', chatSchema); 