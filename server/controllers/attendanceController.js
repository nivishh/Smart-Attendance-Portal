// server/controllers/attendanceController.js
// Attendance: bulk save, list, by-student, today.

const { v4: uuidv4 } = require('uuid');
const { readJson, writeJson } = require('../services/jsonStorage');

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

exports.listAll = async (req, res) => {
  try {
    const attendance = await readJson('attendance');
    return res.json({ attendance });
  } catch (err) {
    console.error('attendance.listAll error:', err);
    return res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
};

// GET /api/attendance?subject=&className=&section=&date=
exports.queryAttendance = async (req, res) => {
  try {
    const { subject, className, section, date } = req.query;
    const attendance = await readJson('attendance');
    const filtered = attendance.filter((a) => {
      if (subject && a.subject !== subject) return false;
      if (className && a.className !== className) return false;
      if (section && a.section !== section) return false;
      if (date && a.date !== date) return false;
      return true;
    });
    return res.json({ attendance: filtered });
  } catch (err) {
    console.error('attendance.query error:', err);
    return res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
};

// GET /api/attendance/today
exports.todayAttendance = async (req, res) => {
  try {
    const today = todayStr();
    const attendance = await readJson('attendance');
    const filtered = attendance.filter((a) => a.date === today);
    return res.json({ date: today, attendance: filtered });
  } catch (err) {
    console.error('attendance.today error:', err);
    return res.status(500).json({ message: 'Failed to fetch today attendance.' });
  }
};

// GET /api/attendance/student/:rollNo
exports.studentAttendance = async (req, res) => {
  try {
    const { rollNo } = req.params;
    if (req.user && req.user.role === 'student') {
      if (String(req.user.rollNo) !== String(rollNo)) {
        return res.status(403).json({ message: 'You can only view your own attendance.' });
      }
    }
    const attendance = await readJson('attendance');
    const records = attendance.filter(
      (a) => String(a.studentRollNo) === String(rollNo)
    );
    const bySubject = {};
    for (const r of records) {
      if (!bySubject[r.subject]) {
        bySubject[r.subject] = { subject: r.subject, present: 0, absent: 0, total: 0, records: [] };
      }
      bySubject[r.subject].records.push(r);
      bySubject[r.subject].total += 1;
      if (r.status === 'Present') bySubject[r.subject].present += 1;
      else bySubject[r.subject].absent += 1;
    }
    const subjects = Object.values(bySubject).map((s) => ({
      subject: s.subject,
      present: s.present,
      absent: s.absent,
      total: s.total,
      percentage: s.total === 0 ? 0 : Math.round((s.present / s.total) * 1000) / 10,
      records: s.records,
    }));

    const totalAll = records.length;
    const presentAll = records.filter((r) => r.status === 'Present').length;
    const overall = totalAll === 0 ? 0 : Math.round((presentAll / totalAll) * 1000) / 10;

    return res.json({
      rollNo,
      totalRecords: totalAll,
      present: presentAll,
      absent: totalAll - presentAll,
      overallPercentage: overall,
      subjects,
      records,
    });
  } catch (err) {
    console.error('attendance.student error:', err);
    return res.status(500).json({ message: 'Failed to fetch student attendance.' });
  }
};

// POST /api/attendance/bulk
exports.bulkSave = async (req, res) => {
  try {
    const { subject, className, section, date, records } = req.body || {};

    const errors = [];
    if (!subject) errors.push('Subject is required.');
    if (!className) errors.push('Class is required.');
    if (!section) errors.push('Section is required.');
    if (!date) errors.push('Date is required.');
    if (!Array.isArray(records)) errors.push('Records array is required.');

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    for (const r of records) {
      if (!r.studentRollNo || !r.studentName) {
        errors.push('Each attendance record needs studentRollNo and studentName.');
        break;
      }
      if (r.status !== 'Present' && r.status !== 'Absent') {
        errors.push(`Invalid status for ${r.studentRollNo}. Must be Present or Absent.`);
        break;
      }
    }
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    const attendance = await readJson('attendance');

    const existingMap = new Map();
    for (const a of attendance) {
      if (a.subject === subject && a.date === date) {
        existingMap.set(String(a.studentRollNo), a);
      }
    }

    let updated = 0;
    let created = 0;
    const results = [];

    for (const r of records) {
      const key = String(r.studentRollNo);
      const existing = existingMap.get(key);
      if (existing) {
        existing.status = r.status;
        existing.studentName = r.studentName || existing.studentName;
        existing.className = className;
        existing.section = section;
        existing.branch = r.branch || existing.branch;
        existing.updatedAt = new Date().toISOString();
        updated += 1;
        results.push(existing);
      } else {
        const rec = {
          id: uuidv4(),
          studentRollNo: r.studentRollNo,
          studentName: r.studentName,
          className,
          section,
          branch: r.branch || '',
          subject,
          date,
          status: r.status,
          createdAt: new Date().toISOString(),
        };
        attendance.push(rec);
        existingMap.set(key, rec);
        created += 1;
        results.push(rec);
      }
    }

    await writeJson('attendance', attendance);

    return res.json({
      message: 'Attendance saved successfully.',
      created,
      updated,
      total: results.length,
      records: results,
    });
  } catch (err) {
    console.error('attendance.bulkSave error:', err);
    return res.status(500).json({ message: 'Failed to save attendance.' });
  }
};