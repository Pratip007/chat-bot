const mongoose = require('mongoose');

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
    messages: [{
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Drop all indexes and recreate only the ones we need
userSchema.index({ userId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

// Drop the email index if it exists
User.collection.dropIndex('email_1').catch(() => {});

module.exports = User; 