// server/routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/studentController");
const { requireAdmin } = require("../middleware/authMiddleware");

// Public helper for dropdowns (no auth)
router.get("/meta", ctrl.getClassMeta);

// Admin-only routes
router.get("/", requireAdmin, ctrl.listStudents);
router.get("/:rollNo", requireAdmin, ctrl.getStudent);
router.post("/", requireAdmin, ctrl.createStudent);
router.delete("/:rollNo", requireAdmin, ctrl.deleteStudent);

// Admin-only: reset a student's password
router.post("/:rollNo/reset-password", requireAdmin, ctrl.resetStudentPassword);

module.exports = router;
