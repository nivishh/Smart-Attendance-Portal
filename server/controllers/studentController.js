// server/controllers/studentController.js
// CRUD operations for students + password reset.

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { readJson, writeJson } = require("../services/jsonStorage");

const VALID_CLASSES = [
  "B.Tech 1st Year",
  "B.Tech 2nd Year",
  "B.Tech 3rd Year",
  "B.Tech 4th Year",
];
const VALID_SECTIONS = ["A", "B", "C", "D"];
const VALID_BRANCHES = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "AIDS", "CSBS"];
const VALID_COURSES = [
  "B.Tech",
  "M.Tech",
  "BCA",
  "MCA",
  "B.Sc",
  "M.Sc",
  "B.Com",
  "B.A",
];

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));
}

function isPhone(v) {
  return /^[+]?[\d\s\-()]{7,15}$/.test(String(v || ""));
}

exports.listStudents = async (req, res) => {
  try {
    const students = await readJson("students");
    const safe = students.map((s) => {
      const { passwordHash, ...rest } = s;
      return rest;
    });
    return res.json({ students: safe });
  } catch (err) {
    console.error("listStudents error:", err);
    return res.status(500).json({ message: "Failed to fetch students." });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const { rollNo } = req.params;
    const students = await readJson("students");
    const s = students.find(
      (x) => String(x.rollNo).toLowerCase() === String(rollNo).toLowerCase(),
    );
    if (!s) return res.status(404).json({ message: "Student not found." });
    const { passwordHash, ...rest } = s;
    return res.json({ student: rest });
  } catch (err) {
    console.error("getStudent error:", err);
    return res.status(500).json({ message: "Failed to fetch student." });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const {
      fullName,
      rollNo,
      className,
      section,
      branch,
      course,
      email,
      phone,
      password,
    } = req.body || {};

    const errors = [];
    if (!fullName || !fullName.trim()) errors.push("Full name is required.");
    if (!rollNo || !rollNo.trim()) errors.push("Roll number is required.");
    if (!className) errors.push("Class is required.");
    if (!section) errors.push("Section is required.");
    if (!branch) errors.push("Branch is required.");

    if (email && !isEmail(email)) errors.push("Invalid email address.");
    if (phone && !isPhone(phone)) errors.push("Invalid phone number.");

    if (className && !VALID_CLASSES.includes(className))
      errors.push("Invalid class value.");
    if (section && !VALID_SECTIONS.includes(section))
      errors.push("Invalid section value.");
    if (branch && !VALID_BRANCHES.includes(branch))
      errors.push("Invalid branch value.");
    if (course && !VALID_COURSES.includes(course))
      errors.push("Invalid course value.");

    // Validate custom password if provided
    let finalPassword = "student123";
    if (password !== undefined && password !== "") {
      if (String(password).length < 6) {
        errors.push("Password must be at least 6 characters long.");
      } else if (String(password).length > 100) {
        errors.push("Password must be at most 100 characters long.");
      } else {
        finalPassword = String(password);
      }
    }

    if (errors.length) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const students = await readJson("students");
    const exists = students.find(
      (s) =>
        String(s.rollNo).toLowerCase() === String(rollNo).trim().toLowerCase(),
    );
    if (exists) {
      return res.status(409).json({
        message: "A student with this roll number already exists.",
        errors: ["Duplicate roll number."],
      });
    }

    const passwordHash = bcrypt.hashSync(finalPassword, 10);

    const student = {
      id: uuidv4(),
      fullName: fullName.trim(),
      rollNo: rollNo.trim(),
      className,
      section,
      branch,
      course: course || "",
      email: (email || "").trim(),
      phone: (phone || "").trim(),
      passwordHash,
      passwordChangedAt: null,
      createdAt: new Date().toISOString(),
    };

    students.push(student);
    await writeJson("students", students);

    const { passwordHash: _ph, ...safe } = student;
    return res.status(201).json({
      message: "Student record added successfully!",
      student: safe,
    });
  } catch (err) {
    console.error("createStudent error:", err);
    return res.status(500).json({ message: "Failed to save student record." });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { rollNo } = req.params;
    const students = await readJson("students");
    const idx = students.findIndex(
      (s) => String(s.rollNo).toLowerCase() === String(rollNo).toLowerCase(),
    );
    if (idx === -1) {
      return res.status(404).json({ message: "Student not found." });
    }
    const removed = students.splice(idx, 1)[0];
    await writeJson("students", students);
    const { passwordHash, ...safe } = removed;
    return res.json({
      message: "Student record deleted successfully.",
      student: safe,
    });
  } catch (err) {
    console.error("deleteStudent error:", err);
    return res
      .status(500)
      .json({ message: "Failed to delete student record." });
  }
};

// NEW: Admin resets a student's password
// Body: { newPassword }
exports.resetStudentPassword = async (req, res) => {
  try {
    const { rollNo } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }
    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const students = await readJson("students");
    const idx = students.findIndex(
      (s) => String(s.rollNo).toLowerCase() === String(rollNo).toLowerCase(),
    );
    if (idx === -1) {
      return res.status(404).json({ message: "Student not found." });
    }

    students[idx].passwordHash = bcrypt.hashSync(String(newPassword), 10);
    students[idx].passwordChangedAt = new Date().toISOString();
    await writeJson("students", students);

    return res.json({
      message: `Password reset successfully for ${students[idx].fullName} (${students[idx].rollNo}).`,
    });
  } catch (err) {
    console.error("resetStudentPassword error:", err);
    return res.status(500).json({ message: "Failed to reset password." });
  }
};

exports.getClassMeta = async (req, res) => {
  return res.json({
    classes: VALID_CLASSES,
    sections: VALID_SECTIONS,
    branches: VALID_BRANCHES,
    courses: VALID_COURSES,
  });
};

exports.VALID_CLASSES = VALID_CLASSES;
exports.VALID_SECTIONS = VALID_SECTIONS;
exports.VALID_BRANCHES = VALID_BRANCHES;
exports.VALID_COURSES = VALID_COURSES;
