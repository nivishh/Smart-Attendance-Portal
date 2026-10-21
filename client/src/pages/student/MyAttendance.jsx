// client/src/pages/student/MyAttendance.jsx
// "Show My Attendance" page.
// Button opens a modal with two options: Today's Attendance / All Attendance.

import React, { useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  History,
  X,
  Filter,
  AlertCircle,
  Check,
  XCircle,
} from "lucide-react";
import { attendanceApi, errorMessage } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../components/Notification";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatDate, todayStr, formatPercent } from "../../utils/formatters";

export default function MyAttendance() {
  const { user } = useAuth();
  const notify = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");

  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    setModalOpen(false);
  };

  const loadToday = async () => {
    setView("today");
    setModalOpen(false);
    setLoading(true);
    setData(null);
    try {
      const all = await attendanceApi.byStudent(user.rollNo);
      const today = todayStr();
      const todayRecords = (all.records || []).filter((r) => r.date === today);
      const bySubject = {};
      for (const r of todayRecords) {
        if (!bySubject[r.subject]) {
          bySubject[r.subject] = {
            subject: r.subject,
            present: 0,
            absent: 0,
            total: 0,
            records: [],
          };
        }
        bySubject[r.subject].records.push(r);
        bySubject[r.subject].total += 1;
        if (r.status === "Present") bySubject[r.subject].present += 1;
        else bySubject[r.subject].absent += 1;
      }
      const subjects = Object.values(bySubject).map((s) => ({
        ...s,
        percentage: s.total === 0 ? 0 : (s.present / s.total) * 100,
      }));
      setData({ date: today, subjects, records: todayRecords });
    } catch (err) {
      notify.error(errorMessage(err, "Failed to load today's attendance."));
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    setView("all");
    setModalOpen(false);
    setLoading(true);
    setData(null);
    setSubjectFilter("");
    try {
      const resp = await attendanceApi.byStudent(user.rollNo);
      setData(resp);
    } catch (err) {
      notify.error(
        errorMessage(err, "Failed to load your attendance records."),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!view && !loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ margin: 0 }}>My Attendance</h2>
            <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
              Choose what you want to view: today's classes or your full
              attendance history.
            </p>
          </div>
          <div className="badge info">
            <CalendarCheck size={14} /> Attendance
          </div>
        </div>
        <div className="empty-state">
          <div className="ico">
            <CalendarCheck size={28} />
          </div>
          <h4>Select an option to begin</h4>
          <p className="text-muted text-sm">
            Click below to view your attendance.
          </p>
          <button onClick={openModal} className="mt-3">
            <CalendarCheck size={16} /> Show My Attendance
          </button>
        </div>
        <AttendanceModal
          open={modalOpen}
          onClose={closeModal}
          onToday={loadToday}
          onAll={loadAll}
        />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>
            {view === "today" ? "Today's Attendance" : "All Attendance Records"}
          </h2>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            {view === "today"
              ? `Records for ${formatDate(todayStr())} (Roll No: ${user.rollNo})`
              : `Complete attendance history for ${user.name} (Roll No: ${user.rollNo})`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              setView(null);
              setData(null);
            }}
          >
            Back
          </button>
          <button onClick={openModal}>
            <CalendarCheck size={16} /> Switch View
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading attendance..." />
      ) : view === "today" ? (
        <TodayView data={data} />
      ) : (
        <AllView
          data={data}
          subjectFilter={subjectFilter}
          setSubjectFilter={setSubjectFilter}
        />
      )}

      <AttendanceModal
        open={modalOpen}
        onClose={closeModal}
        onToday={loadToday}
        onAll={loadAll}
      />
    </div>
  );
}

function AttendanceModal({ open, onClose, onToday, onAll }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex-between mb-3">
          <h3 style={{ margin: 0 }}>View Attendance</h3>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-muted text-sm">Select an option below:</p>
        <div className="grid grid-2 mt-3">
          <button
            className="btn-secondary"
            style={{ padding: 20, flexDirection: "column", gap: 8 }}
            onClick={onToday}
          >
            <CalendarDays size={28} />
            <div style={{ fontWeight: 700 }}>Today's Attendance</div>
            <div className="text-muted text-sm">
              View records for today only
            </div>
          </button>
          <button
            className="btn-secondary"
            style={{ padding: 20, flexDirection: "column", gap: 8 }}
            onClick={onAll}
          >
            <History size={28} />
            <div style={{ fontWeight: 700 }}>All Attendance</div>
            <div className="text-muted text-sm">View your full history</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function TodayView({ data }) {
  if (!data || data.subjects.length === 0) {
    return (
      <div className="empty-state">
        <div className="ico">
          <AlertCircle size={28} />
        </div>
        <h4>No attendance records found for today.</h4>
        <p className="text-muted text-sm">
          Either no classes have been marked yet, or you had no lectures today.
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Total Lectures Recorded</th>
                <th>Lectures Present</th>
                <th>Lectures Absent</th>
                <th>Attendance Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((s) => (
                <tr key={s.subject}>
                  <td>{formatDate(data.date)}</td>
                  <td>
                    <strong>{s.subject}</strong>
                  </td>
                  <td>{s.total}</td>
                  <td>
                    <span className="badge present">
                      <Check size={12} /> {s.present}
                    </span>
                  </td>
                  <td>
                    <span className="badge absent">
                      <XCircle size={12} /> {s.absent}
                    </span>
                  </td>
                  <td>
                    <strong>{formatPercent(s.percentage)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AllView({ data, subjectFilter, setSubjectFilter }) {
  if (!data) return null;
  const subjects = data.subjects || [];
  const filteredSubjects = subjectFilter
    ? subjects.filter((s) => s.subject === subjectFilter)
    : subjects;
  const filteredRecords = subjectFilter
    ? (data.records || []).filter((r) => r.subject === subjectFilter)
    : data.records || [];

  if (subjects.length === 0) {
    return (
      <div className="empty-state">
        <div className="ico">
          <AlertCircle size={28} />
        </div>
        <h4>No attendance records found.</h4>
        <p className="text-muted text-sm">
          You have no attendance records yet. Please check back after your
          teachers have marked attendance.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-3 mb-4">
        <div className="stat">
          <div
            className="stat-ico"
            style={{
              background: "linear-gradient(135deg, var(--success), #15803d)",
            }}
          >
            <Check size={20} />
          </div>
          <div>
            <div className="stat-val">
              {data.present}/{data.totalRecords}
            </div>
            <div className="stat-label">Overall Lectures Present</div>
          </div>
        </div>
        <div className="stat">
          <div
            className="stat-ico"
            style={{
              background: "linear-gradient(135deg, var(--danger), #b91c1c)",
            }}
          >
            <XCircle size={20} />
          </div>
          <div>
            <div className="stat-val">{data.absent}</div>
            <div className="stat-label">Total Lectures Absent</div>
          </div>
        </div>
        <div className="stat">
          <div
            className="stat-ico"
            style={{
              background:
                "linear-gradient(135deg, var(--navy-700), var(--indigo-500))",
            }}
          >
            <CalendarCheck size={20} />
          </div>
          <div>
            <div className="stat-val">
              {formatPercent(data.overallPercentage)}
            </div>
            <div className="stat-label">Overall Percentage</div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-3 mb-3"
        style={{ flexWrap: "wrap" }}
      >
        <Filter size={16} color="var(--text-muted)" />
        <label htmlFor="subjectFilter" style={{ margin: 0 }}>
          Filter by subject:
        </label>
        <select
          id="subjectFilter"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{ maxWidth: 280 }}
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.subject} value={s.subject}>
              {s.subject} ({formatPercent(s.percentage)})
            </option>
          ))}
        </select>
      </div>

      <h4 className="mt-4">Subject-wise Summary</h4>
      <div className="table-wrap mb-4">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Total Lectures</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((s) => (
                <tr key={s.subject}>
                  <td>
                    <strong>{s.subject}</strong>
                  </td>
                  <td>
                    <span className="badge present">{s.present}</span>
                  </td>
                  <td>
                    <span className="badge absent">{s.absent}</span>
                  </td>
                  <td>{s.total}</td>
                  <td>
                    <strong
                      style={{
                        color:
                          s.percentage >= 75
                            ? "var(--success)"
                            : s.percentage >= 50
                              ? "var(--warning)"
                              : "var(--danger)",
                      }}
                    >
                      {formatPercent(s.percentage)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h4 className="mt-4">Detailed Records</h4>
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Present Count</th>
                <th>Absent Count</th>
                <th>Total Lectures</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((r) => {
                  const subj = subjects.find(
                    (s) => s.subject === r.subject,
                  ) || { present: 0, absent: 0, total: 0, percentage: 0 };
                  return (
                    <tr key={r.id}>
                      <td>{formatDate(r.date)}</td>
                      <td>
                        <strong>{r.subject}</strong>
                      </td>
                      <td>
                        {r.status === "Present" ? (
                          <span className="badge present">
                            <Check size={12} /> Present
                          </span>
                        ) : (
                          <span className="badge absent">
                            <XCircle size={12} /> Absent
                          </span>
                        )}
                      </td>
                      <td>{subj.present}</td>
                      <td>{subj.absent}</td>
                      <td>{subj.total}</td>
                      <td>
                        <strong>{formatPercent(subj.percentage)}</strong>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
