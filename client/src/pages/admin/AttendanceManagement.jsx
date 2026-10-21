// client/src/pages/admin/AttendanceManagement.jsx
import React, { useEffect, useState } from "react";
import { CalendarCheck, Save, Users, AlertCircle } from "lucide-react";
import { studentApi, attendanceApi, errorMessage } from "../../api/api";
import { useNotification } from "../../components/Notification";
import LoadingSpinner from "../../components/LoadingSpinner";
import { todayStr, formatDate } from "../../utils/formatters";

const SUBJECTS = [
  "Web Technology",
  "Data Structures",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Software Engineering",
  "Machine Learning",
  "Artificial Intelligence",
  "Compiler Design",
  "Cloud Computing",
];

export default function AttendanceManagement() {
  const notify = useNotification();
  const [meta, setMeta] = useState({ classes: [], sections: [], branches: [] });
  const [filters, setFilters] = useState({
    subject: "",
    className: "",
    section: "",
    date: todayStr(),
  });
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [existingMap, setExistingMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    studentApi
      .meta()
      .then(setMeta)
      .catch(() => {});
  }, []);

  const updateFilter = (field) => (e) => {
    setFilters((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleShowRecords = async () => {
    if (
      !filters.subject ||
      !filters.className ||
      !filters.section ||
      !filters.date
    ) {
      notify.warning("Please select subject, class, section, and date.");
      return;
    }
    setLoading(true);
    setHasLoaded(true);
    try {
      const studentsResp = await studentApi.list();
      const matching = studentsResp.students.filter(
        (s) =>
          s.className === filters.className && s.section === filters.section,
      );
      matching.sort((a, b) =>
        String(a.rollNo).localeCompare(String(b.rollNo), undefined, {
          numeric: true,
        }),
      );
      setStudents(matching);

      const attResp = await attendanceApi.query(filters);
      const existing = {};
      const statusMap = {};
      for (const r of attResp.attendance) {
        existing[String(r.studentRollNo)] = r.id;
        statusMap[String(r.studentRollNo)] = r.status;
      }
      setExistingMap(existing);
      setAttendanceMap(statusMap);

      if (matching.length === 0) {
        notify.info("No students found for the selected class and section.");
      } else if (Object.keys(existing).length > 0) {
        notify.info(
          `Loaded ${Object.keys(existing).length} previously saved attendance record(s).`,
        );
      }
    } catch (err) {
      notify.error(errorMessage(err, "Failed to load student records."));
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (rollNo, status) => {
    setAttendanceMap((m) => ({ ...m, [String(rollNo)]: status }));
  };

  const unmarkedCount = students.filter(
    (s) => !attendanceMap[String(s.rollNo)],
  ).length;

  const handleSave = async () => {
    if (students.length === 0) {
      notify.warning("No students to save attendance for.");
      return;
    }
    if (unmarkedCount > 0) {
      notify.warning(
        `${unmarkedCount} student(s) have no status selected. They will be skipped.`,
      );
    }
    const records = students
      .filter((s) => attendanceMap[String(s.rollNo)])
      .map((s) => ({
        studentRollNo: s.rollNo,
        studentName: s.fullName,
        branch: s.branch,
        status: attendanceMap[String(s.rollNo)],
      }));

    if (records.length === 0) {
      notify.warning(
        "No attendance entries to save. Mark at least one student.",
      );
      return;
    }

    setSaving(true);
    try {
      const resp = await attendanceApi.bulkSave({
        subject: filters.subject,
        className: filters.className,
        section: filters.section,
        date: filters.date,
        records,
      });
      notify.success(
        `Attendance saved. ${resp.created} new, ${resp.updated} updated.`,
      );
      const fresh = await attendanceApi.query(filters);
      const newExisting = {};
      const newStatus = {};
      for (const r of fresh.attendance) {
        newExisting[String(r.studentRollNo)] = r.id;
        newStatus[String(r.studentRollNo)] = r.status;
      }
      setExistingMap(newExisting);
      setAttendanceMap(newStatus);
    } catch (err) {
      notify.error(errorMessage(err, "Failed to save attendance."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>Attendance Management</h2>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            Pick a subject, class, section, and date — then mark each student
            Present or Absent. Saved attendance can be edited later.
          </p>
        </div>
        <div className="badge info">
          <CalendarCheck size={14} /> Mark Attendance
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="subject">Course / Subject *</label>
          <select
            id="subject"
            value={filters.subject}
            onChange={updateFilter("subject")}
          >
            <option value="">— Select Subject —</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="className">Class *</label>
          <select
            id="className"
            value={filters.className}
            onChange={updateFilter("className")}
          >
            <option value="">— Select Class —</option>
            {meta.classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="section">Section *</label>
          <select
            id="section"
            value={filters.section}
            onChange={updateFilter("section")}
          >
            <option value="">— Select Section —</option>
            {meta.sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="date">Attendance Date *</label>
          <input
            id="date"
            type="date"
            value={filters.date}
            onChange={updateFilter("date")}
            max={todayStr()}
          />
        </div>
      </div>

      <div className="form-actions">
        <button onClick={handleShowRecords} disabled={loading}>
          <Users size={16} /> {loading ? "Loading..." : "Show Student Records"}
        </button>
      </div>

      {hasLoaded && (
        <div className="mt-4">
          {loading ? (
            <LoadingSpinner label="Fetching student records..." />
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="ico">
                <AlertCircle size={28} />
              </div>
              <h4>No students found</h4>
              <p className="text-muted text-sm">
                No students are registered for {filters.className} - Section{" "}
                {filters.section}. Add students first via the Add Student page.
              </p>
            </div>
          ) : (
            <>
              <div
                className="flex-between mb-3"
                style={{ flexWrap: "wrap", gap: 12 }}
              >
                <div className="text-sm text-muted">
                  Showing <strong>{students.length}</strong> students for{" "}
                  <strong>{filters.subject}</strong> on{" "}
                  <strong>{formatDate(filters.date)}</strong>. Unmarked:{" "}
                  <strong>{unmarkedCount}</strong>
                </div>
              </div>
              <div className="table-wrap">
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Class</th>
                        <th>Section</th>
                        <th>Present</th>
                        <th>Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => {
                        const status = attendanceMap[String(s.rollNo)];
                        const isPresent = status === "Present";
                        const isAbsent = status === "Absent";
                        const alreadySaved = !!existingMap[String(s.rollNo)];
                        return (
                          <tr key={s.id}>
                            <td>
                              <strong>{s.rollNo}</strong>
                            </td>
                            <td>{s.fullName}</td>
                            <td>{s.className}</td>
                            <td>{s.section}</td>
                            <td>
                              <label
                                className={`seg ${isPresent ? "sel-present" : ""}`}
                                style={{ border: "none", padding: 0 }}
                              >
                                <input
                                  type="radio"
                                  name={`att-${s.rollNo}`}
                                  checked={isPresent}
                                  onChange={() =>
                                    setStatus(s.rollNo, "Present")
                                  }
                                />
                                <span
                                  className="badge present"
                                  style={{
                                    cursor: "pointer",
                                    opacity: isPresent ? 1 : 0.5,
                                  }}
                                >
                                  Present
                                </span>
                              </label>
                            </td>
                            <td>
                              <label
                                className={`seg ${isAbsent ? "sel-absent" : ""}`}
                                style={{ border: "none", padding: 0 }}
                              >
                                <input
                                  type="radio"
                                  name={`att-${s.rollNo}`}
                                  checked={isAbsent}
                                  onChange={() => setStatus(s.rollNo, "Absent")}
                                />
                                <span
                                  className="badge absent"
                                  style={{
                                    cursor: "pointer",
                                    opacity: isAbsent ? 1 : 0.5,
                                  }}
                                >
                                  Absent
                                </span>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-actions mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-success"
                >
                  <Save size={16} />{" "}
                  {saving ? "Saving..." : "Save Attendance Data"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
