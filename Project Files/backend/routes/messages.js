const express = require("express")
const { body, validationResult } = require("express-validator")
const Message = require("../models/Message")
const Complaint = require("../models/Complaint")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Send message
router.post(
  "/",
  authenticateToken,
  [
    body("complaintId").isMongoId().withMessage("Invalid complaint ID"),
    body("message").trim().notEmpty().withMessage("Message is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { complaintId, message } = req.body

      // Check if complaint exists and user has access
      const complaint = await Complaint.findById(complaintId)
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        })
      }

      // Check access rights
      const hasAccess =
        complaint.submittedBy.toString() === req.user._id.toString() ||
        req.user.userType === "Admin" ||
        (req.user.userType === "Agent" &&
          complaint.assignedAgent &&
          complaint.assignedAgent.toString() === req.user._id.toString())

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      const newMessage = new Message({
        complaintId,
        senderId: req.user._id,
        senderName: req.user.fullName,
        senderType: req.user.userType,
        message,
      })

      await newMessage.save()

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      })
    } catch (error) {
      console.error("Send message error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to send message",
      })
    }
  },
)

// Get messages for a complaint
router.get("/complaint/:complaintId", authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params

    // Check if complaint exists and user has access
    const complaint = await Complaint.findById(complaintId)
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      })
    }

    // Check access rights
    const hasAccess =
      complaint.submittedBy.toString() === req.user._id.toString() ||
      req.user.userType === "Admin" ||
      (req.user.userType === "Agent" &&
        complaint.assignedAgent &&
        complaint.assignedAgent.toString() === req.user._id.toString())

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const messages = await Message.find({
      complaintId,
      isDeleted: false,
    })
      .populate("senderId", "fullName")
      .sort({ createdAt: 1 })

    // Mark messages as read for current user
    await Message.updateMany(
      {
        complaintId,
        senderId: { $ne: req.user._id },
        "readBy.userId": { $ne: req.user._id },
      },
      {
        $push: { readBy: { userId: req.user._id } },
        $set: { isRead: true },
      },
    )

    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("Fetch messages error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    })
  }
})

// Get unread message count
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    let matchQuery = {}

    if (req.user.userType === "Ordinary") {
      // For ordinary users, count unread messages in their complaints
      const userComplaints = await Complaint.find({ submittedBy: req.user._id }).select("_id")
      const complaintIds = userComplaints.map((c) => c._id)

      matchQuery = {
        complaintId: { $in: complaintIds },
        senderId: { $ne: req.user._id },
        "readBy.userId": { $ne: req.user._id },
      }
    } else if (req.user.userType === "Agent") {
      // For agents, count unread messages in assigned complaints
      const assignedComplaints = await Complaint.find({ assignedAgent: req.user._id }).select("_id")
      const complaintIds = assignedComplaints.map((c) => c._id)

      matchQuery = {
        complaintId: { $in: complaintIds },
        senderId: { $ne: req.user._id },
        "readBy.userId": { $ne: req.user._id },
      }
    } else {
      // For admins, count all unread messages
      matchQuery = {
        senderId: { $ne: req.user._id },
        "readBy.userId": { $ne: req.user._id },
      }
    }

    const unreadCount = await Message.countDocuments(matchQuery)

    res.json({
      success: true,
      data: { unreadCount },
    })
  } catch (error) {
    console.error("Unread count error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    })
  }
})

// Mark message as read
router.put("/:messageId/read", authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      })
    }

    await message.markAsRead(req.user._id)

    res.json({
      success: true,
      message: "Message marked as read",
    })
  } catch (error) {
    console.error("Mark read error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
    })
  }
})

module.exports = router
