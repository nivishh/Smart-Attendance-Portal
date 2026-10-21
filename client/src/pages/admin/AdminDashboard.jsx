// client/src/pages/admin/AdminDashboard.jsx
// Admin dashboard shell. Nested routes render inside <Outlet />.
// Summary overview is rendered by the index route (AdminOverview).

import React, { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  UserPlus,
  CalendarCheck,
  FileText,
  Trash2,
  LayoutDashboard,
  Users,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { studentApi, attendanceApi, assignmentApi } from "../../api/api";
import LoadingSpinner from "../../components/LoadingSpinner";

const NAV = [
  {
    to: "/admin",
    label: "Overview",
    icon: <LayoutDashboard size={18} />,
    end: true,
  },
  {
    to: "/admin/add-student",
    label: "Add Student",
    icon: <UserPlus size={18} />,
  },
  {
    to: "/admin/attendance",
    label: "Attendance",
    icon: <CalendarCheck size={18} />,
  },
  {
    to: "/admin/assignments",
    label: "Assignments",
    icon: <FileText size={18} />,
  },
  {
    to: "/admin/delete-student",
    label: "Delete Student Record",
    icon: <Trash2 size={18} />,
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div className="dash-shell">
      <Sidebar items={NAV} footerLabel="Logout" />
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Welcome back, {user?.name || "Administrator"}. Manage students,
              attendance and assignments.
            </p>
          </div>
          <div className="user-chip">
            <span className="badge purple">Admin</span>
            {user?.name}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

// Inline Overview component for the index route.
export function AdminOverview() {
  const [stats, setStats] = useState({
    students: 0,
    attendanceToday: 0,
    assignments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [s, a, asg] = await Promise.all([
          studentApi.list(),
          attendanceApi.today(),
          assignmentApi.list(),
        ]);
        if (mounted) {
          setStats({
            students: s.students?.length || 0,
            attendanceToday: a.attendance?.length || 0,
            assignments: asg.assignments?.length || 0,
          });
        }
      } catch {
        // overview is non-critical
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading overview..." />;

  return (
    <>
      <div className="grid grid-3">
        <div className="stat">
          <div
            className="stat-ico"
            style={{
              background:
                "linear-gradient(135deg, var(--navy-700), var(--indigo-500))",
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div className="stat-val">{stats.students}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>
        <div className="stat">
          <div
            className="stat-ico"
            style={{
              background: "linear-gradient(135deg, var(--success), #15803d)",
            }}
          >
            <CalendarCheck size={22} />
          </div>
          <div>
            <div className="stat-val">{stats.attendanceToday}</div>
            <div className="stat-label">Attendance Records (Today)</div>
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
            <div className="stat-val">{stats.assignments}</div>
            <div className="stat-label">Total Assignments</div>
          </div>
        </div>
      </div>

      <div className="card mt-5">
        <h3>Quick Actions</h3>
        <p className="text-muted text-sm">
          Use the buttons below or the sidebar to navigate to each section.
          Every action you take (adding students, marking attendance, uploading
          assignments, deleting records) is saved immediately to the backend
          JSON files.
        </p>
        <div className="flex gap-3 flex-wrap mt-3">
          <Link to="/admin/add-student" className="btn btn-secondary">
            <UserPlus size={16} /> Add a Student
          </Link>
          <Link to="/admin/attendance" className="btn btn-secondary">
            <CalendarCheck size={16} /> Mark Attendance
          </Link>
          <Link to="/admin/assignments" className="btn btn-secondary">
            <FileText size={16} /> Upload Assignment
          </Link>
          <Link to="/admin/delete-student" className="btn btn-secondary">
            <Trash2 size={16} /> Delete Record
          </Link>
        </div>
      </div>
    </>
  );
}
