const express = require("express")
const { body, validationResult } = require("express-validator")
const Complaint = require("../models/Complaint")
const Message = require("../models/Message")
const User = require("../models/User")
const { authenticateToken, requireAgent } = require("../middleware/auth")

const router = express.Router()

// All routes require agent authentication
router.use(authenticateToken)
router.use(requireAgent)

// Get agent dashboard stats
router.get("/dashboard", async (req, res) => {
  try {
    const agentId = req.user._id

    const [assignedComplaints, inProgressComplaints, resolvedComplaints, totalComplaints, pendingMessages] =
      await Promise.all([
        Complaint.countDocuments({ assignedAgent: agentId, status: "Assigned" }),
        Complaint.countDocuments({ assignedAgent: agentId, status: "In-Progress" }),
        Complaint.countDocuments({ assignedAgent: agentId, status: "Resolved" }),
        Complaint.countDocuments({ assignedAgent: agentId }),
        Message.countDocuments({
          complaintId: { $in: await Complaint.find({ assignedAgent: agentId }).distinct("_id") },
          senderId: { $ne: agentId },
          "readBy.userId": { $ne: agentId },
        }),
      ])

    const stats = {
      assigned: assignedComplaints,
      inProgress: inProgressComplaints,
      resolved: resolvedComplaints,
      total: totalComplaints,
      pendingMessages,
    }

    res.json({
      success: true,
      data: { stats },
    })
  } catch (error) {
    console.error("Agent dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    })
  }
})

// Get assigned complaints
router.get("/assigned-complaints", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const status = req.query.status

    const query = { assignedAgent: req.user._id }
    if (status) {
      query.status = status
    }

    const complaints = await Complaint.find(query)
      .populate("submittedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Complaint.countDocuments(query)

    res.json({
      success: true,
      data: complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Fetch assigned complaints error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned complaints",
    })
  }
})

// Update complaint status
router.put(
  "/complaints/:id/status",
  [body("status").isIn(["Assigned", "In-Progress", "Resolved"]).withMessage("Invalid status")],
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

      const { status } = req.body
      const complaint = await Complaint.findOne({
        _id: req.params.id,
        assignedAgent: req.user._id,
      })

      if (!complaint) {
        console.warn(`Attempt to resolve non-existent or unassigned complaint ID: ${req.params.id} by agent ${req.user._id}`)
        return res.status(404).json({
          success: false,
          message: "Complaint not found or not assigned to you",
        })
      }

      complaint.status = status
      await complaint.save()

      // Update agent workload
      if (status === "Resolved") {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: {
            "workload.resolved": 1,
            "workload.active": -1,
          },
        })
      }

      res.json({
        success: true,
        message: "Status updated successfully",
        data: complaint,
      })
    } catch (error) {
      console.error("Update status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update status",
      })
    }
  },
)

// Resolve complaint with description
router.put(
  "/complaints/:id/resolve",
  [body("resolutionDescription").trim().notEmpty().withMessage("Resolution description is required")],
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

      const { resolutionDescription } = req.body
      console.log(`Attempting to resolve complaint ID: ${req.params.id} with description: ${resolutionDescription}`)
      const complaint = await Complaint.findOne({
        _id: req.params.id,
        assignedAgent: req.user._id,
      })

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found or not assigned to you",
        })
      }

      complaint.status = "Resolved"
      complaint.resolutionDescription = resolutionDescription
      complaint.resolvedAt = new Date()
      await complaint.save()

      // Update agent workload
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          "workload.resolved": 1,
          "workload.active": -1,
        },
      })

      // Send system message about resolution
      const systemMessage = new Message({
        complaintId: complaint._id,
        senderId: req.user._id,
        senderName: req.user.fullName,
        senderType: "Agent",
        message: `Complaint has been resolved. Resolution: ${resolutionDescription}`,
        messageType: "system",
      })
      await systemMessage.save()

      console.log(`Complaint ID: ${complaint._id} successfully resolved by agent ${req.user._id}`)

      res.json({
        success: true,
        message: "Complaint resolved successfully",
        data: complaint,
      })
    } catch (error) {
      console.error(`Error resolving complaint ID: ${req.params.id}:`, error)
      res.status(500).json({
        success: false,
        message: "Failed to resolve complaint",
      })
    }
  },
)

// Get complaint details
router.get("/complaints/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedAgent: req.user._id,
    })
      .populate("submittedBy", "fullName email phoneNumber")
      .populate("assignedAgent", "fullName email")

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found or not assigned to you",
      })
    }

    res.json({
      success: true,
      message: "Complaint resolved successfully",
      data: complaint,
    })
  } catch (error) {
    console.error("Fetch complaint details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaint details",
    })
  }
})

// Get agent performance metrics
router.get("/performance", async (req, res) => {
  try {
    const agentId = req.user._id
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalAssigned, totalResolved, avgResolutionTime, recentActivity] = await Promise.all([
      Complaint.countDocuments({ assignedAgent: agentId }),
      Complaint.countDocuments({ assignedAgent: agentId, status: "Resolved" }),
      Complaint.aggregate([
        {
          $match: {
            assignedAgent: agentId,
            status: "Resolved",
            assignedAt: { $exists: true },
            resolvedAt: { $exists: true },
          },
        },
        {
          $project: {
            resolutionTime: {
              $subtract: ["$resolvedAt", "$assignedAt"],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$resolutionTime" },
          },
        },
      ]),
      Complaint.find({
        assignedAgent: agentId,
        updatedAt: { $gte: thirtyDaysAgo },
      })
        .select("complaintId status updatedAt")
        .sort({ updatedAt: -1 })
        .limit(10),
    ])

    const performance = {
      totalAssigned,
      totalResolved,
      resolutionRate: totalAssigned > 0 ? ((totalResolved / totalAssigned) * 100).toFixed(2) : 0,
      avgResolutionTime: avgResolutionTime.length > 0 ? Math.round(avgResolutionTime[0].avgTime / (1000 * 60 * 60)) : 0, // in hours
      recentActivity,
    }

    res.json({
      success: true,
      data: performance,
    })
  } catch (error) {
    console.error("Performance metrics error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance metrics",
    })
  }
})

module.exports = router
