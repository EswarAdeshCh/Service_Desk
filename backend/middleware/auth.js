const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      console.log("Authentication failed: No token provided.");
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log(
        `Authentication failed: User with ID ${decoded.id} not found.`
      );
      return res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
      });
    }

    if (!user.isActive) {
      console.log(
        `Authentication failed: User ${user.email} account is deactivated.`
      );
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      console.error("Authentication failed: Invalid token.", error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    } else if (error.name === "TokenExpiredError") {
      console.error("Authentication failed: Token expired.", error.message);
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Token verification failed:", error);
    return res.status(500).json({
      success: false,
      message: "Token verification failed",
    });
  }
};
// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

// Check if user is agent
const requireAgent = (req, res, next) => {
  if (req.user.userType !== "Agent") {
    return res.status(403).json({
      success: false,
      message: "Agent access required",
    });
  }
  next();
};

// Check if user is admin or agent
const requireAgentOrAdmin = (req, res, next) => {
  if (!["Admin", "Agent"].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: "Agent or Admin access required",
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAgent,
  requireAgentOrAdmin,
};
