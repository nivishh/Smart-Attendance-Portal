// server/routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/attendanceController");
const { requireAdmin, requireAuth } = require("../middleware/authMiddleware");

router.get("/", requireAuth, ctrl.queryAttendance);
router.get("/today", requireAuth, ctrl.todayAttendance);
router.get("/student/:rollNo", requireAuth, ctrl.studentAttendance);
router.post("/bulk", requireAdmin, ctrl.bulkSave);

module.exports = router;
