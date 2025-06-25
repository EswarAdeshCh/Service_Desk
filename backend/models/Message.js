const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ["Admin", "Agent", "Ordinary"],
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better performance
messageSchema.index({ complaintId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1 })
messageSchema.index({ isRead: 1 })

// Mark message as read
messageSchema.methods.markAsRead = function (userId) {
  if (!this.readBy.some((read) => read.userId.toString() === userId.toString())) {
    this.readBy.push({ userId })
    this.isRead = true
  }
  return this.save()
}

module.exports = mongoose.model("Message", messageSchema)
