const express = require("express")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  })
}

// Register new user
router.post(
  "/register",
  [
    body("fullName").trim().isLength({ min: 2 }).withMessage("Full name must be at least 2 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phoneNumber").isMobilePhone().withMessage("Please provide a valid phone number"),
    body("userType").isIn(["Admin", "Agent", "Ordinary"]).withMessage("Invalid user type"),
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

      const { fullName, email, password, phoneNumber, userType } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        })
      }

      // Create new user
      const user = new User({
        fullName,
        email,
        password,
        phoneNumber,
        userType,
      })

      await user.save()

      // Generate token
      const token = generateToken(user._id)

      // Remove password from response
      const userResponse = user.toObject()
      delete userResponse.password

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: userResponse,
          token,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message,
      })
    }
  },
)

// Login user
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
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

      const { email, password } = req.body

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select("+password")
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        })
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated. Please contact administrator.",
        })
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        })
      }

      // Update last login
      await user.updateLastLogin()

      // Generate token
      const token = generateToken(user._id)

      // Remove password from response
      const userResponse = user.toObject()
      delete userResponse.password

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: userResponse,
          token,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Login failed",
        error: error.message,
      })
    }
  },
)

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    })
  }
})

// Update user profile
router.put(
  "/profile",
  authenticateToken,
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

      const { fullName, phoneNumber } = req.body
      const updateData = {}

      if (fullName) updateData.fullName = fullName
      if (phoneNumber) updateData.phoneNumber = phoneNumber

      const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true }).select(
        "-password",
      )

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      })
    } catch (error) {
      console.error("Profile update error:", error)
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
  authenticateToken,
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

      // Get user with password
      const user = await User.findById(req.user._id).select("+password")

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

// Logout (client-side implementation)
router.post("/logout", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Logout successful",
  })
})

module.exports = router
