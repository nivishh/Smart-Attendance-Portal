// client/src/pages/admin/DeleteStudent.jsx
import React, { useEffect, useState } from "react";
import {
  Trash2,
  Users,
  AlertCircle,
  Search,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { studentApi, errorMessage } from "../../api/api";
import { useNotification } from "../../components/Notification";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function DeleteStudent() {
  const notify = useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  // NEW: reset password state
  const [resetTarget, setResetTarget] = useState(null); // student object
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    setLoading(true);
    setHasLoaded(true);
    try {
      const resp = await studentApi.list();
      const list = (resp.students || [])
        .slice()
        .sort((a, b) =>
          String(a.rollNo).localeCompare(String(b.rollNo), undefined, {
            numeric: true,
          }),
        );
      setStudents(list);
      notify.info(`Loaded ${list.length} student record(s).`);
    } catch (err) {
      notify.error(errorMessage(err, "Failed to load student records."));
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(s.rollNo).toLowerCase().includes(q) ||
      String(s.fullName).toLowerCase().includes(q) ||
      String(s.email || "")
        .toLowerCase()
        .includes(q) ||
      String(s.className).toLowerCase().includes(q) ||
      String(s.section).toLowerCase().includes(q) ||
      String(s.branch).toLowerCase().includes(q)
    );
  });

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await studentApi.remove(toDelete.rollNo);
      notify.success(
        `Student record deleted: ${toDelete.fullName} (${toDelete.rollNo}).`,
      );
      setStudents((arr) => arr.filter((x) => x.rollNo !== toDelete.rollNo));
      setToDelete(null);
    } catch (err) {
      notify.error(errorMessage(err, "Failed to delete student record."));
    } finally {
      setDeleting(false);
    }
  };

  // NEW: open the reset password modal
  const openResetModal = (student) => {
    setResetTarget(student);
    setNewPassword("");
    setShowPassword(false);
  };

  const closeResetModal = () => {
    setResetTarget(null);
    setNewPassword("");
    setShowPassword(false);
  };

  // NEW: submit the password reset
  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (!newPassword) {
      notify.warning("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      notify.warning("Password must be at least 6 characters long.");
      return;
    }
    setResetting(true);
    try {
      const resp = await studentApi.resetPassword(
        resetTarget.rollNo,
        newPassword,
      );
      notify.success(
        resp.message || `Password reset for ${resetTarget.fullName}.`,
      );
      closeResetModal();
    } catch (err) {
      notify.error(errorMessage(err, "Failed to reset password."));
    } finally {
      setResetting(false);
    }
  };

  // NEW: generate a random password suggestion
  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    setNewPassword(pwd);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>Manage Students</h2>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            Click the button below to load all student records. You can then
            delete any record (with confirmation) or reset a student's login
            password. Historical attendance and assignments are preserved for
            academic accuracy.
          </p>
        </div>
        <div
          className="badge"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
        >
          <Trash2 size={14} /> Destructive Actions
        </div>
      </div>

      {!hasLoaded ? (
        <div className="empty-state">
          <div className="ico">
            <Users size={28} />
          </div>
          <h4>No records loaded yet</h4>
          <p className="text-muted text-sm">
            Click the button below to fetch and display all student records.
          </p>
          <button onClick={load} disabled={loading}>
            <Users size={16} />{" "}
            {loading ? "Loading..." : "Show All Student Records"}
          </button>
        </div>
      ) : loading ? (
        <LoadingSpinner label="Loading students..." />
      ) : students.length === 0 ? (
        <div className="empty-state">
          <div className="ico">
            <AlertCircle size={28} />
          </div>
          <h4>No students found</h4>
          <p className="text-muted text-sm">
            Add students first via the Add Student page.
          </p>
        </div>
      ) : (
        <>
          <div
            className="flex-between mb-3"
            style={{ flexWrap: "wrap", gap: 12 }}
          >
            <div className="text-sm text-muted">
              Showing <strong>{filtered.length}</strong> of{" "}
              <strong>{students.length}</strong> students.
            </div>
            <div style={{ position: "relative", minWidth: 260 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search by name, roll, class, branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
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
                    <th>Branch</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.rollNo}</strong>
                      </td>
                      <td>{s.fullName}</td>
                      <td>{s.className}</td>
                      <td>{s.section}</td>
                      <td>{s.branch}</td>
                      <td>{s.email || "—"}</td>
                      <td>
                        <div
                          className="flex gap-2"
                          style={{ flexWrap: "wrap" }}
                        >
                          <button
                            className="btn-secondary"
                            onClick={() => openResetModal(s)}
                            title="Reset login password"
                          >
                            <KeyRound size={14} /> Reset Password
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => setToDelete(s)}
                            title="Delete this record"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">
                        No students match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete this student record?"
        message="Are you sure you want to delete this student? The student will no longer be able to log in. Historical attendance and assignment records will be preserved for academic accuracy."
        details={
          toDelete
            ? `${toDelete.fullName} — Roll No: ${toDelete.rollNo} (${toDelete.className} / ${toDelete.section})`
            : ""
        }
        confirmLabel="Yes, Delete Record"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />

      {/* NEW: Reset Password modal */}
      {resetTarget && (
        <div className="modal-backdrop" onClick={closeResetModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between mb-3">
              <h3 style={{ margin: 0 }}>Reset Student Password</h3>
              <button
                className="btn-ghost"
                onClick={closeResetModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div
              style={{
                background: "var(--bg-soft)",
                padding: 12,
                borderRadius: 12,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <div>
                <strong>Name:</strong> {resetTarget.fullName}
              </div>
              <div>
                <strong>Roll No:</strong> {resetTarget.rollNo}
              </div>
              <div>
                <strong>Class:</strong> {resetTarget.className} / Section{" "}
                {resetTarget.section}
              </div>
            </div>
            <div className="field">
              <label htmlFor="newPassword">
                New Password *{" "}
                <span className="text-muted text-sm">(min 6 characters)</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    padding: 4,
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="hint">
                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    padding: 0,
                    fontSize: 12,
                    color: "var(--indigo-500)",
                    textDecoration: "underline",
                  }}
                  onClick={generateRandomPassword}
                >
                  Generate a random password
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeResetModal}>
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={resetting}>
                <KeyRound size={16} />{" "}
                {resetting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
