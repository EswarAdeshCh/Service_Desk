const mongoose = require("mongoose")

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In-Progress", "Resolved", "Closed"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    category: {
      type: String,
      enum: ["Technical", "Billing", "Service", "Hardware", "Software", "Other"],
      default: "Other",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionDescription: {
      type: String,
      default: null,
    },
    attachments: [
      {
        filename: String,
        path: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    tags: [String],
    estimatedResolutionTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better performance
complaintSchema.index({ complaintId: 1 })
complaintSchema.index({ status: 1 })
complaintSchema.index({ submittedBy: 1 })
complaintSchema.index({ assignedAgent: 1 })
complaintSchema.index({ createdAt: -1 })

// Generate complaint ID before saving
complaintSchema.pre("save", async function (next) {
  if (!this.complaintId) {
    const count = await mongoose.model("Complaint").countDocuments()
    this.complaintId = `CMP${String(count + 1).padStart(6, "0")}`
  }
  next()
})

// Update status timestamps
complaintSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "Assigned" && !this.assignedAt) {
      this.assignedAt = new Date()
    }
    if (this.status === "Resolved" && !this.resolvedAt) {
      this.resolvedAt = new Date()
    }
  }
  next()
})

module.exports = mongoose.model("Complaint", complaintSchema)
