// server/controllers/authController.js
// Handles admin + student login, current user lookup, logout, change password.

const bcrypt = require("bcryptjs");
const { readJson, writeJson } = require("../services/jsonStorage");
const { signToken } = require("../middleware/authMiddleware");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";

let cachedAdminHash = null;
async function getAdminHash() {
  if (cachedAdminHash) return cachedAdminHash;
  if (process.env.ADMIN_PASSWORD_HASH) {
    cachedAdminHash = process.env.ADMIN_PASSWORD_HASH;
    return cachedAdminHash;
  }
  cachedAdminHash = bcrypt.hashSync("admin123", 10);
  return cachedAdminHash;
}

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }
    const expectedUser = ADMIN_USERNAME;
    if (
      String(username).trim().toLowerCase() !==
      String(expectedUser).toLowerCase()
    ) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }
    const hash = await getAdminHash();
    const ok = await bcrypt.compare(String(password), hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }
    const token = signToken({
      id: "admin",
      role: "admin",
      name: "Administrator",
    });
    return res.json({
      message: "Admin login successful.",
      token,
      user: {
        id: "admin",
        role: "admin",
        name: "Administrator",
        username: expectedUser,
      },
    });
  } catch (err) {
    console.error("adminLogin error:", err);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};

exports.studentLogin = async (req, res) => {
  try {
    const { rollNo, password } = req.body || {};
    if (!rollNo || !password) {
      return res
        .status(400)
        .json({ message: "Roll number and password are required." });
    }
    const students = await readJson("students");
    const student = students.find(
      (s) =>
        String(s.rollNo).toLowerCase() === String(rollNo).trim().toLowerCase(),
    );
    if (!student) {
      return res
        .status(401)
        .json({ message: "Student not found. Please check your roll number." });
    }
    if (!student.passwordHash) {
      return res
        .status(401)
        .json({ message: "Account not configured for login. Contact admin." });
    }
    const ok = await bcrypt.compare(String(password), student.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Incorrect password." });
    }
    const token = signToken({
      id: student.id,
      role: "student",
      rollNo: student.rollNo,
      name: student.fullName,
    });
    return res.json({
      message: "Student login successful.",
      token,
      user: {
        id: student.id,
        role: "student",
        rollNo: student.rollNo,
        name: student.fullName,
        className: student.className,
        section: student.section,
        branch: student.branch,
      },
    });
  } catch (err) {
    console.error("studentLogin error:", err);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};

exports.me = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated." });
    if (req.user.role === "admin") {
      return res.json({
        user: {
          id: "admin",
          role: "admin",
          name: "Administrator",
          username: ADMIN_USERNAME,
        },
      });
    }
    if (req.user.role === "student") {
      const students = await readJson("students");
      const student = students.find((s) => s.id === req.user.id);
      if (!student) {
        return res
          .status(404)
          .json({ message: "Student record no longer exists." });
      }
      return res.json({
        user: {
          id: student.id,
          role: "student",
          rollNo: student.rollNo,
          name: student.fullName,
          className: student.className,
          section: student.section,
          branch: student.branch,
          course: student.course,
          email: student.email,
          phone: student.phone,
        },
      });
    }
    return res.status(403).json({ message: "Unknown role." });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Failed to fetch user." });
  }
};

exports.logout = async (req, res) => {
  return res.json({ message: "Logged out." });
};

// NEW: Student changes their own password
// Body: { currentPassword, newPassword }
exports.changeStudentPassword = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can change their own password." });
    }
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required." });
    }
    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long." });
    }

    const students = await readJson("students");
    const idx = students.findIndex((s) => s.id === req.user.id);
    if (idx === -1) {
      return res
        .status(404)
        .json({ message: "Student record no longer exists." });
    }

    const student = students[idx];
    const ok = await bcrypt.compare(
      String(currentPassword),
      student.passwordHash,
    );
    if (!ok) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    student.passwordHash = bcrypt.hashSync(String(newPassword), 10);
    student.passwordChangedAt = new Date().toISOString();
    students[idx] = student;
    await writeJson("students", students);

    return res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("changeStudentPassword error:", err);
    return res.status(500).json({ message: "Failed to change password." });
  }
};
