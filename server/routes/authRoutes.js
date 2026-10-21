// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.post("/admin-login", ctrl.adminLogin);
router.post("/student-login", ctrl.studentLogin);
router.get("/me", requireAuth, ctrl.me);
router.post("/logout", requireAuth, ctrl.logout);

// Student-only: change own password
router.post(
  "/change-password",
  requireAuth,
  requireRole("student"),
  ctrl.changeStudentPassword,
);

module.exports = router;
