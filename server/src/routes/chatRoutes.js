const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { isAdmin } = require('../middleware/auth');

// Get chat history for a session
router.get('/history/:sessionId', async (req, res) => {
  try {
    const chats = await chatController.getChatHistory(req.params.sessionId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chat history' });
  }
});

// Get all chats (admin only)
router.get('/all', isAdmin, async (req, res) => {
  try {
    const { page, limit } = req.query;
    const chats = await chatController.getAllChats(
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching all chats' });
  }
});

// Process a new message
router.post('/message', async (req, res) => {
  try {
    const response = await chatController.processMessage({
      ...req.body,
      userId: req.user.userId
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Error processing message' });
  }
});

module.exports = router; 