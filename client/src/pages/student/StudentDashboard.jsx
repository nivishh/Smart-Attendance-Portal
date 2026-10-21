// client/src/pages/student/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Percent,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  attendanceApi,
  assignmentApi,
  authApi,
  errorMessage,
} from "../../api/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatPercent } from "../../utils/formatters";
import { useNotification } from "../../components/Notification";

const NAV = [
  {
    to: "/student",
    label: "Overview",
    icon: <LayoutDashboard size={18} />,
    end: true,
  },
  {
    to: "/student/attendance",
    label: "Show My Attendance",
    icon: <CalendarCheck size={18} />,
  },
  {
    to: "/student/assignments",
    label: "Show My Assignments",
    icon: <FileText size={18} />,
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const notify = useNotification();
  // NEW: change password state
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const openPwModal = () => {
    setPwModalOpen(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
  };
  const closePwModal = () => {
    setPwModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      notify.warning("Please fill in all three password fields.");
      return;
    }
    if (newPassword.length < 6) {
      notify.warning("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.warning("New password and confirm password do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      notify.warning("New password must be different from current password.");
      return;
    }
    setChangingPw(true);
    try {
      const resp = await authApi.changePassword(currentPassword, newPassword);
      notify.success(resp.message || "Password changed successfully.");
      closePwModal();
    } catch (err) {
      notify.error(errorMessage(err, "Failed to change password."));
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="dash-shell">
      <Sidebar items={NAV} footerLabel="Logout" />
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1>Student Dashboard</h1>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Hello {user?.name || "Student"} — Roll No:{" "}
              <strong>{user?.rollNo}</strong>
              {user?.className && <> · {user.className}</>}
              {user?.section && <> / Section {user.section}</>}
            </p>
          </div>
          <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
            {/* NEW: Change Password button */}
            <button
              className="btn-secondary"
              onClick={openPwModal}
              title="Change your login password"
            >
              <KeyRound size={16} /> Change Password
            </button>
            <div className="user-chip">
              <span className="badge purple">Student</span>
              {user?.name}
            </div>
          </div>
        </div>
        <Outlet />

        {/* NEW: Change Password modal */}
        {pwModalOpen && (
          <div className="modal-backdrop" onClick={closePwModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="flex-between mb-3">
                <h3 style={{ margin: 0 }}>Change My Password</h3>
                <button
                  className="btn-ghost"
                  onClick={closePwModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p className="text-muted text-sm" style={{ marginTop: 0 }}>
                Choose a new password (min 6 characters). You'll need to log in
                again with the new password after this.
              </p>

              <div className="field">
                <label htmlFor="currentPassword">Current Password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowCurrent(!showCurrent)}
                    style={{
                      position: "absolute",
                      right: 4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: 4,
                    }}
                    aria-label={showCurrent ? "Hide" : "Show"}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowNew(!showNew)}
                    style={{
                      position: "absolute",
                      right: 4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: 4,
                    }}
                    aria-label={showNew ? "Hide" : "Show"}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="confirmPassword">Confirm New Password *</label>
                <input
                  id="confirmPassword"
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={closePwModal}>
                  Cancel
                </button>
                <button onClick={handleChangePassword} disabled={changingPw}>
                  <KeyRound size={16} />{" "}
                  {changingPw ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Inline Overview component for the index route.
export function StudentOverview() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    percentage: null,
    total: 0,
    present: 0,
    assignments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.rollNo) return;
      try {
        const [att, asg] = await Promise.all([
          attendanceApi.byStudent(user.rollNo),
          assignmentApi.studentAssignments(),
        ]);
        if (mounted) {
          setSummary({
            percentage: att.overallPercentage,
            total: att.totalRecords,
            present: att.present,
            assignments: asg.assignments?.length || 0,
          });
        }
      } catch {
        // ignore — non-critical
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) return <LoadingSpinner label="Loading your overview..." />;

  return (
    <>
      <div className="grid grid-3">
        <div className="stat">
          <div
            className="stat-ico"
            style={{
              background: "linear-gradient(135deg, var(--success), #15803d)",
            }}
          >
            <Percent size={22} />
          </div>
          <div>
            <div className="stat-val">{formatPercent(summary.percentage)}</div>
            <div className="stat-label">Overall Attendance</div>
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
            <CalendarCheck size={22} />
          </div>
          <div>
            <div className="stat-val">
              {summary.present}/{summary.total}
            </div>
            <div className="stat-label">Lectures Present</div>
          </div>
        </div>
        <div className="stat">
          <div
            className="stat-ico"
            style={{
              background:
                "linear-gradient(135deg, var(--purple-500), var(--indigo-400))",
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div className="stat-val">{summary.assignments}</div>
            <div className="stat-label">Assignments for You</div>
          </div>
        </div>
      </div>

      <div className="card mt-5">
        <h3>What would you like to do?</h3>
        <p className="text-muted text-sm">
          Use the buttons below to view your attendance records or browse
          assignments for your class and section. You can also change your login
          password using the "Change Password" button at the top right.
        </p>
        <div className="flex gap-3 flex-wrap mt-3">
          <Link to="/student/attendance" className="btn">
            <CalendarCheck size={16} /> Show My Attendance
          </Link>
          <Link to="/student/assignments" className="btn btn-secondary">
            <FileText size={16} /> Show My Assignments
          </Link>
        </div>
      </div>
    </>
  );
}
