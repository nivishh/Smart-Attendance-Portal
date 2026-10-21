// server/server.js
// Express app entrypoint for Smart Attendance Management Portal.

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { ensureFile, UPLOAD_DIR } = require("./services/jsonStorage");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
// Raw body capture for JSON parsing
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Ensure data + upload dirs exist at boot
(async () => {
  await ensureFile("students");
  await ensureFile("attendance");
  await ensureFile("assignments");
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
})();

// Serve uploaded files statically so the frontend can preview images.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Smart Attendance Portal API",
    time: new Date().toISOString(),
  });
});
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found." });
});

// Centralized error handler — never leak stack traces to client
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ message: "File too large. Maximum 10 MB allowed." });
  }
  if (err && err.message && err.message.includes("Unsupported file format")) {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`\n[Smart Attendance Portal] API server running at:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health\n`);
});
