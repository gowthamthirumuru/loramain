/**
 * Message Model
 * Individual messages within conversations
 */

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    // Reference to parent conversation
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },

    // Sender name
    sender: {
        type: String,
        required: true,
        trim: true
    },

    // Message content
    message: {
        type: String,
        required: true
    },

    // Display time string
    time: String,

    // Is this from the command center (own message)
    isOwnMessage: {
        type: Boolean,
        default: false
    },

    // Has the message been read
    read: {
        type: Boolean,
        default: false
    },

    // Message type for special messages
    messageType: {
        type: String,
        enum: ['text', 'alert', 'location', 'status_update'],
        default: 'text'
    },

    // Attached location if any
    location: {
        lat: Number,
        lng: Number
    }

}, { timestamps: true });

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Set time string on save
MessageSchema.pre('save', function (next) {
    if (!this.time) {
        this.time = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    next();
});

// After saving a message, update the conversation's lastMessage
MessageSchema.post('save', async function () {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(this.conversationId, {
        lastMessage: this.message.substring(0, 100),
        lastActivityAt: new Date(),
        $inc: { unread: this.isOwnMessage ? 0 : 1 }
    });
});

module.exports = mongoose.model('Message', MessageSchema);
