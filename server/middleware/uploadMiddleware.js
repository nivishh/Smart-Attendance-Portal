// server/middleware/uploadMiddleware.js
// Multer configuration for PDF and image uploads.
// - 10 MB max file size
// - Allows PDF, JPG, JPEG, PNG, WEBP
// - Stores files in server/uploads/

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_EXTS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 40);
    const unique = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}_${unique}_${safeBase}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Only PDF, JPG, JPEG, PNG, WEBP are allowed.",
      ),
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = {
  upload,
  UPLOAD_DIR,
  ALLOWED_MIMES,
  ALLOWED_EXTS,
  MAX_FILE_SIZE,
};
