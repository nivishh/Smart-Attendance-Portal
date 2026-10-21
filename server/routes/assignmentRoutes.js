// server/routes/assignmentRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/assignmentController");
const { requireAdmin, requireAuth } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

router.get("/", requireAuth, ctrl.listAll);
router.get("/student", requireAuth, ctrl.studentAssignments);
router.post("/", requireAdmin, upload.single("file"), ctrl.uploadAssignment);
router.get("/:id", requireAuth, ctrl.getAssignment);
router.get("/:id/download", requireAuth, ctrl.downloadAssignment);
router.delete("/:id", requireAdmin, ctrl.deleteAssignment);

module.exports = router;
