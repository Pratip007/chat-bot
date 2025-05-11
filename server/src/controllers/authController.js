const User = require('../models/User');
const processMessage = require('./chatController').processMessage;

exports.getUser = async (req, res) => {
  try {
    const { userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    let user = await User.findOne({ userId });

    if (!user) {
      user = await User.create({
        userId,
        username,
        messages: []
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
};

exports.handleChat = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    let user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add user message
    user.messages.push({
      content: message,
      timestamp: new Date()
    });

    // Get bot response
    const botResponse = await processMessage({
      text: message,
      userId: userId
    });

    // Add bot response
    user.messages.push({
      content: botResponse.text,
      timestamp: new Date()
    });

    await user.save();

    res.json({
      userMessage: message,
      botResponse: botResponse.text,
      user: user
    });
  } catch (error) {
    console.error('Error in handleChat:', error);
    res.status(500).json({ error: 'Error processing chat' });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.messages);
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res.status(500).json({ error: 'Error fetching chat history' });
  }
}; 