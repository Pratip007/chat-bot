const Chat = require('../models/Chat');

// Simple response mapping for common queries
const responseMap = {
  'hello': 'Hello! How can I help you today?',
  'hi': 'Hi there! How may I assist you?',
  'help': 'I can help you with:\n1. Product information\n2. Order status\n3. Returns and refunds\n4. Technical support\nWhat would you like to know?',
  'bye': 'Thank you for chatting with us. Have a great day!',
  'thanks': 'You\'re welcome! Is there anything else I can help you with?'
};

exports.processMessage = async (message) => {
  try {
    const lowerMessage = message.text.toLowerCase();
    let response = 'I\'m not sure I understand. Could you please rephrase your question?';

    // Check for matching responses
    for (const [key, value] of Object.entries(responseMap)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    // Save the chat to database
    const chat = new Chat({
      message: message.text,
      response: response,
      userId: message.userId
    });
    await chat.save();

    return {
      text: response,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return {
      text: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date()
    };
  }
};

exports.getChatHistory = async (userId) => {
  try {
    const chats = await Chat.find({ userId })
      .sort({ timestamp: 1 })
      .limit(50);
    return chats;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

exports.getAllChats = async (page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;
    const chats = await Chat.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Chat.countDocuments();
    
    return {
      chats,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error fetching all chats:', error);
    throw error;
  }
}; 