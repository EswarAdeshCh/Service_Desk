const express = require("express")
const { body, validationResult } = require("express-validator")
const Complaint = require("../models/Complaint")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Create new complaint
router.post(
  "/",
  authenticateToken,
  [
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    body("pincode").trim().notEmpty().withMessage("Zip code is required"),
    body("comment").trim().notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array())
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { name, address, city, state, pincode, comment } = req.body

      console.log("Received complaint data:", { name, address, city, state, pincode, comment })
      console.log("Authenticated user:", req.user)

      const complaint = new Complaint({
        name,
        address,
        city,
        state,
        pincode,
        comment,
        submittedBy: req.user._id,
      })

      await complaint.save()

      res.status(201).json({
        success: true,
        message: "Complaint submitted successfully",
        data: complaint,
      })
    } catch (error) {
      console.error("Complaint creation error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to submit complaint",
      })
    }
  },
)

// Get user's complaints
router.get("/my-complaints", authenticateToken, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const complaints = await Complaint.find({ submittedBy: req.user._id })
      .populate("assignedAgent", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Complaint.countDocuments({ submittedBy: req.user._id })

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

// Get single complaint
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("submittedBy", "fullName email")
      .populate("assignedAgent", "fullName email")

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      })
    }

    // Check if user has access to this complaint
    const hasAccess =
      complaint.submittedBy._id.toString() === req.user._id.toString() ||
      req.user.userType === "Admin" ||
      (req.user.userType === "Agent" &&
        complaint.assignedAgent &&
        complaint.assignedAgent._id.toString() === req.user._id.toString())

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: complaint,
    })
  } catch (error) {
    console.error("Fetch complaint error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaint",
    })
  }
})

// Update complaint status (for users to cancel)
router.put("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body
    const complaint = await Complaint.findById(req.params.id)

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      })
    }

    // Only allow complaint owner to cancel
    if (complaint.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Only allow cancellation if complaint is pending
    if (complaint.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify complaint status",
      })
    }

    if (status === "Closed") {
      complaint.status = status
      await complaint.save()

      res.json({
        success: true,
        message: "Complaint cancelled successfully",
        data: complaint,
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid status update",
      })
    }
  } catch (error) {
    console.error("Status update error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    })
  }
})

module.exports = router
