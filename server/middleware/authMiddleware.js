// server/middleware/authMiddleware.js
// JWT auth + role-based authorization middleware.

const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "smart-attendance-portal-demo-secret-change-me";
const JWT_EXPIRES_IN = "8h";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Generic auth: requires a valid Bearer token
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Authentication required." });
    }
    const decoded = verifyToken(parts[1]);
    req.user = decoded; // { id, role, rollNo?, name? }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
}

// Require a specific role (or one of several roles)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: "You do not have permission to perform this action.",
        });
    }
    next();
  };
}

// Admin-only guard
const requireAdmin = [requireAuth, requireRole("admin")];

// Student-or-admin guard (students can access their own data only)
const requireStudentOrAdmin = [
  requireAuth,
  (req, res, next) => {
    if (req.user.role === "admin") return next();
    if (req.user.role === "student") return next();
    return res.status(403).json({ message: "Access denied." });
  },
];

module.exports = {
  JWT_SECRET,
  signToken,
  verifyToken,
  requireAuth,
  requireRole,
  requireAdmin,
  requireStudentOrAdmin,
};
