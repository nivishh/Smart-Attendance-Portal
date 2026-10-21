// server/controllers/assignmentController.js
// Assignment upload + retrieval. Files stored in server/uploads/.

const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { readJson, writeJson, UPLOAD_DIR } = require("../services/jsonStorage");

function isImage(filename) {
  const ext = path.extname(filename || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
}
function isPdf(filename) {
  return path.extname(filename || "").toLowerCase() === ".pdf";
}

exports.listAll = async (req, res) => {
  try {
    const assignments = await readJson("assignments");
    return res.json({ assignments });
  } catch (err) {
    console.error("assignment.listAll error:", err);
    return res.status(500).json({ message: "Failed to fetch assignments." });
  }
};

// GET /api/assignments/student
exports.studentAssignments = async (req, res) => {
  try {
    let { className, section } = req.query;

    if (req.user && req.user.role === "student") {
      const students = await readJson("students");
      const s = students.find((x) => x.id === req.user.id);
      if (!s) {
        return res
          .status(404)
          .json({ message: "Student record no longer exists." });
      }
      className = s.className;
      section = s.section;
    }

    if (!className || !section) {
      return res
        .status(400)
        .json({ message: "Class and section are required." });
    }
    const assignments = await readJson("assignments");
    const filtered = assignments.filter(
      (a) => a.className === className && a.section === section,
    );
    filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    return res.json({ assignments: filtered });
  } catch (err) {
    console.error("assignment.studentAssignments error:", err);
    return res.status(500).json({ message: "Failed to fetch assignments." });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignments = await readJson("assignments");
    const a = assignments.find((x) => x.id === id);
    if (!a) return res.status(404).json({ message: "Assignment not found." });
    return res.json({ assignment: a });
  } catch (err) {
    console.error("assignment.get error:", err);
    return res.status(500).json({ message: "Failed to fetch assignment." });
  }
};

// POST /api/assignments  (multipart/form-data)
exports.uploadAssignment = async (req, res) => {
  try {
    const { title, subject, className, section, description, dueDate } =
      req.body || {};
    const file = req.file;

    const errors = [];
    if (!title || !title.trim()) errors.push("Assignment title is required.");
    if (!subject) errors.push("Subject is required.");
    if (!className) errors.push("Class is required.");
    if (!section) errors.push("Section is required.");
    if (!dueDate) errors.push("Due date is required.");
    if (!file) errors.push("A file is required.");

    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      errors.push("Invalid due date format. Use YYYY-MM-DD.");
    }

    if (errors.length) {
      if (file && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {}
      }
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const assignment = {
      id: uuidv4(),
      title: title.trim(),
      subject,
      className,
      section,
      description: (description || "").trim(),
      dueDate,
      uploadedAt: new Date().toISOString(),
      fileName: file.originalname,
      storedName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileType: isPdf(file.originalname)
        ? "pdf"
        : isImage(file.originalname)
          ? "image"
          : "other",
    };

    const assignments = await readJson("assignments");
    assignments.push(assignment);
    await writeJson("assignments", assignments);

    const { filePath, ...safe } = assignment;
    return res.status(201).json({
      message: "Assignment uploaded successfully.",
      assignment: safe,
    });
  } catch (err) {
    console.error("assignment.upload error:", err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
    return res.status(500).json({ message: "Failed to upload assignment." });
  }
};

// GET /api/assignments/:id/download
exports.downloadAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignments = await readJson("assignments");
    const a = assignments.find((x) => x.id === id);
    if (!a) return res.status(404).json({ message: "Assignment not found." });
    const fullPath = path.join(UPLOAD_DIR, a.storedName);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "File not found on server." });
    }
    return res.download(fullPath, a.fileName);
  } catch (err) {
    console.error("assignment.download error:", err);
    return res.status(500).json({ message: "Failed to download file." });
  }
};

// DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignments = await readJson("assignments");
    const idx = assignments.findIndex((x) => x.id === id);
    if (idx === -1)
      return res.status(404).json({ message: "Assignment not found." });
    const removed = assignments.splice(idx, 1)[0];
    await writeJson("assignments", assignments);
    const fullPath = path.join(UPLOAD_DIR, removed.storedName);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {}
    }
    return res.json({
      message: "Assignment deleted successfully.",
      assignment: removed,
    });
  } catch (err) {
    console.error("assignment.delete error:", err);
    return res.status(500).json({ message: "Failed to delete assignment." });
  }
};

