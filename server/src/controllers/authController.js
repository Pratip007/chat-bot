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
    const file = req.file;

    if (!userId || (!message && !file)) {
      return res.status(400).json({ error: 'userId and either message or file are required' });
    }

    let user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare message object
    const messageObj = {
      content: message || '',
      timestamp: new Date()
    };

    // Add file information if a file was uploaded
    if (file) {
      // Convert buffer to base64
      const base64Data = file.buffer.toString('base64');
      messageObj.file = {
        filename: file.originalname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        data: `data:${file.mimetype};base64,${base64Data}`
      };
    }

    // Add user message
    user.messages.push(messageObj);

    // Get bot response
    const botResponse = await processMessage({
      text: message || 'File uploaded',
      userId: userId,
      hasFile: !!file
    });

    // Add bot response
    user.messages.push({
      content: botResponse.text,
      timestamp: new Date()
    });

    await user.save();

    res.json({
      userMessage: message || 'File uploaded',
      botResponse: botResponse.text,
      fileData: file ? messageObj.file.data : null,
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