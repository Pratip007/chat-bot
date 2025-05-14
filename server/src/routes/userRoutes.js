const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { userId, username } = req.body;

        // Check if user already exists
        let user = await User.findOne({ userId });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user with only required fields
        user = new User({
            userId,
            username
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add message to user's chat
router.post('/message', async (req, res) => {
    try {
        const { userId, content, sender } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!sender) {
            return res.status(400).json({ message: 'Sender is required' });
        }

        user.messages.push({
            content: content || '',  // Make content optional
            sender,
            timestamp: new Date()
        });

        await user.save();
        res.status(200).json({ message: 'Message added successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's chat history
router.get('/messages/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ messages: user.messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Delete a message from user's chat
// router.delete('/api/chat/message/:messageId',async(req,res)=>{
//   console.log("delete message",);
  
//   try {
//     const { messageId } = req.params;

//     if (!messageId) {
//       return res.status(400).json({ error: 'messageId is required' });
//     }

//     // Find user with this message
//     const user = await User.findOne({ 'messages._id': messageId });
//     if (!user) {
//       return res.status(404).json({ error: 'Message not found' });
//     }

//     // Find the specific message in the array
//     const messageIndex = user.messages.findIndex(msg => msg._id.toString() === messageId);
//     if (messageIndex === -1) {
//       return res.status(404).json({ error: 'Message not found' });
//     }

//     // Mark the message as deleted (soft delete)
//     user.messages[messageIndex].isDeleted = true;
//     user.messages[messageIndex].deletedAt = new Date();

//     await user.save();
    
//     // Emit socket event for real-time updates
//     if (io) {
//       const deletedMessage = {
//         _id: messageId,
//         deletedAt: user.messages[messageIndex].deletedAt,
//         action: 'deleted'
//       };
      
//       // Emit to user's room
//       io.to(user.userId).emit('messageDeleted', deletedMessage);
      
//       // Also notify admins
//       io.to('admin').emit('messageDeleted', { ...deletedMessage, userId: user.userId });
//     }
    
//     res.json({
//       message: 'Message deleted successfully',
//       deletedMessage: user.messages[messageIndex]
//     });
//   } catch (error) {
//     console.error('Error in deleteMessage:', error);
//     res.status(500).json({ error: 'Error deleting message' });
//   }
// })

router.delete('/chat/message/:id',async(req,res)=>{
 
  return await  res.status(200).json({message:"message deleted successfully ABC"});
})

module.exports = router; 