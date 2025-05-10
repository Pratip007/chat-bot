const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: String,
    sender: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    messages: {
        type: [messageSchema],
        default: []
    }
}, { timestamps: true });

// Drop all indexes and recreate only the ones we need
userSchema.index({ userId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

// Drop the email index if it exists
User.collection.dropIndex('email_1').catch(() => {});

module.exports = User; 