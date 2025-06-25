const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const Complaint = require("../models/Complaint")
const Message = require("../models/Message")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()

// All routes require admin authentication
router.use(authenticateToken)
router.use(requireAdmin)

// Get dashboard statistics
router.get("/dashboard-stats", async (req, res) => {
  try {
    const [
      totalComplaints,
      pendingComplaints,
      assignedComplaints,
      inProgressComplaints,
      resolvedComplaints,
      closedComplaints,
      totalUsers,
      activeUsers,
      totalAgents,
      activeAgents,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "Pending" }),
      Complaint.countDocuments({ status: "Assigned" }),
      Complaint.countDocuments({ status: "In-Progress" }),
      Complaint.countDocuments({ status: "Resolved" }),
      Complaint.countDocuments({ status: "Closed" }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ userType: "Agent" }),
      User.countDocuments({ userType: "Agent", isActive: true }),
    ])

    const stats = {
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        assigned: assignedComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        closed: closedComplaints,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      agents: {
        total: totalAgents,
        active: activeAgents,
      },
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    })
  }
})

// Get all complaints
router.get("/complaints", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const status = req.query.status

    const query = {}
    if (status) {
      query.status = status
    }

    const complaints = await Complaint.find(query)
      .populate("submittedBy", "fullName email")
      .populate("assignedAgent", "fullName email")
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
    console.error("Fetch complaints error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    })
  }
})

// Assign complaint to agent
router.put(
  "/complaints/:id/assign",
  [body("agentId").isMongoId().withMessage("Invalid agent ID")],
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

      const { agentId } = req.body

      // Check if agent exists and is active
      const agent = await User.findOne({ _id: agentId, userType: "Agent", isActive: true })
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent not found or inactive",
        })
      }

      // Update complaint
      const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        {
          assignedAgent: agentId,
          status: "Assigned",
          assignedAt: new Date(),
        },
        { new: true },
      ).populate("assignedAgent", "fullName email")

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        })
      }

      // Update agent workload
      await User.findByIdAndUpdate(agentId, {
        $inc: {
          "workload.total": 1,
          "workload.active": 1,
        },
      })

      res.json({
        success: true,
        message: "Complaint assigned successfully",
        data: complaint,
      })
    } catch (error) {
      console.error("Assign complaint error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to assign complaint",
      })
    }
  },
)

// Get all users
router.get("/users", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const userType = req.query.userType

    const query = {}
    if (userType) {
      query.userType = userType
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit)

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Fetch users error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    })
  }
})

// Toggle user status
router.put("/users/:id/toggle-status", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account",
      })
    }

    user.isActive = !user.isActive
    await user.save()

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: user.isActive },
    })
  } catch (error) {
    console.error("Toggle user status error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to toggle user status",
    })
  }
})

// Get all agents with workload
router.get("/agents", async (req, res) => {
  try {
    const agents = await User.find({ userType: "Agent" }).select("-password").sort({ createdAt: -1 })

    // Calculate workload for each agent
    for (const agent of agents) {
      const [activeComplaints, totalComplaints, resolvedComplaints] = await Promise.all([
        Complaint.countDocuments({
          assignedAgent: agent._id,
          status: { $in: ["Assigned", "In-Progress"] },
        }),
        Complaint.countDocuments({ assignedAgent: agent._id }),
        Complaint.countDocuments({
          assignedAgent: agent._id,
          status: { $in: ["Resolved", "Closed"] },
        }),
      ])

      agent.workload = {
        active: activeComplaints,
        total: totalComplaints,
        resolved: resolvedComplaints,
      }
    }

    res.json({
      success: true,
      data: agents,
    })
  } catch (error) {
    console.error("Fetch agents error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch agents",
    })
  }
})

// Create new agent
router.post(
  "/agents",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phoneNumber").isMobilePhone().withMessage("Valid phone number is required"),
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

      const { fullName, email, password, phoneNumber } = req.body

      // Check if email already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        })
      }

      const agent = new User({
        fullName,
        email,
        password,
        phoneNumber,
        userType: "Agent",
      })

      await agent.save()

      // Remove password from response
      const agentResponse = agent.toObject()
      delete agentResponse.password

      res.status(201).json({
        success: true,
        message: "Agent created successfully",
        data: agentResponse,
      })
    } catch (error) {
      console.error("Create agent error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create agent",
      })
    }
  },
)

// Update agent
router.put(
  "/agents/:id",
  [
    body("fullName").optional().trim().notEmpty().withMessage("Full name cannot be empty"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("phoneNumber").optional().isMobilePhone().withMessage("Valid phone number is required"),
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

      const { fullName, email, phoneNumber } = req.body
      const updateData = {}

      if (fullName) updateData.fullName = fullName
      if (email) updateData.email = email
      if (phoneNumber) updateData.phoneNumber = phoneNumber

      const agent = await User.findOneAndUpdate({ _id: req.params.id, userType: "Agent" }, updateData, {
        new: true,
        runValidators: true,
      }).select("-password")

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent not found",
        })
      }

      res.json({
        success: true,
        message: "Agent updated successfully",
        data: agent,
      })
    } catch (error) {
      console.error("Update agent error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update agent",
      })
    }
  },
)

// Delete agent
router.delete("/agents/:id", async (req, res) => {
  try {
    const agent = await User.findOne({ _id: req.params.id, userType: "Agent" })
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      })
    }

    // Check if agent has active complaints
    const activeComplaints = await Complaint.countDocuments({
      assignedAgent: agent._id,
      status: { $in: ["Assigned", "In-Progress"] },
    })

    if (activeComplaints > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete agent with active complaints",
      })
    }

    await User.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Agent deleted successfully",
    })
  } catch (error) {
    console.error("Delete agent error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete agent",
    })
  }
})

module.exports = router
