const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    })
  }
})

// Update user profile
router.put(
  "/profile",
  [
    body("fullName").optional().trim().isLength({ min: 2 }).withMessage("Full name must be at least 2 characters"),
    body("phoneNumber").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
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

      const { fullName, phoneNumber, department } = req.body
      const updateData = {}

      if (fullName) updateData.fullName = fullName
      if (phoneNumber) updateData.phoneNumber = phoneNumber
      if (department) updateData.department = department

      const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true }).select(
        "-password",
      )

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      })
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({
        success: false,
        message: "Profile update failed",
      })
    }
  },
)

// Change password
router.put(
  "/change-password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
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

      const { currentPassword, newPassword } = req.body

      // Get user with password\
      const user = await User.findById(req.user._id).select("+password")

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword)
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        })
      }

      // Update password
      user.password = newPassword
      await user.save()

      res.json({
        success: true,
        message: "Password changed successfully",
      })
    } catch (error) {
      console.error("Password change error:", error)
      res.status(500).json({
        success: false,
        message: "Password change failed",
      })
    }
  },
)

module.exports = router
