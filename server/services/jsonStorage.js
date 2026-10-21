// server/services/jsonStorage.js
// Centralized JSON file storage service.
// - Auto-creates data files if missing.
// - Uses simple in-process write queue to avoid simultaneous writes corrupting JSON.
// - All operations are async (fs/promises).

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const FILES = {
  students: path.join(DATA_DIR, "students.json"),
  attendance: path.join(DATA_DIR, "attendance.json"),
  assignments: path.join(DATA_DIR, "assignments.json"),
};

const DEFAULTS = {
  students: [],
  attendance: [],
  assignments: [],
};

// Per-file write queues to serialize writes
const writeQueues = {};

function ensureQueue(name) {
  if (!writeQueues[name]) {
    writeQueues[name] = Promise.resolve();
  }
  return writeQueues[name];
}

function chainWrite(name, task) {
  const q = ensureQueue(name).then(task, task);
  writeQueues[name] = q.catch(() => {});
  return q;
}

async function ensureDataDir() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
}

async function ensureFile(name) {
  await ensureDataDir();
  const filePath = FILES[name];
  if (!filePath) throw new Error(`Unknown storage file: ${name}`);
  try {
    await fsp.access(filePath);
  } catch {
    await fsp.writeFile(
      filePath,
      JSON.stringify(DEFAULTS[name] || [], null, 2),
      "utf8",
    );
  }
}

async function readJson(name) {
  await ensureFile(name);
  const filePath = FILES[name];
  const raw = await fsp.readFile(filePath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // Corrupt JSON — back up and reset to default to avoid total failure
    const backup = `${filePath}.corrupt.${Date.now()}.bak`;
    try {
      await fsp.writeFile(backup, raw, "utf8");
    } catch {}
    await fsp.writeFile(
      filePath,
      JSON.stringify(DEFAULTS[name] || [], null, 2),
      "utf8",
    );
    return DEFAULTS[name] || [];
  }
}

async function writeJson(name, data) {
  return chainWrite(name, async () => {
    await ensureFile(name);
    const filePath = FILES[name];
    const tmp = `${filePath}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fsp.rename(tmp, filePath);
  });
}

module.exports = {
  FILES,
  UPLOAD_DIR,
  DATA_DIR,
  readJson,
  writeJson,
  ensureFile,
};
