// client/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { NotificationProvider } from "./components/Notification";

import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/AdminLogin";
import StudentLogin from "./pages/StudentLogin";
import NotFound from "./pages/NotFound";

import AdminDashboard, { AdminOverview } from "./pages/admin/AdminDashboard";
import AddStudent from "./pages/admin/AddStudent";
import AttendanceManagement from "./pages/admin/AttendanceManagement";
import AssignmentManagement from "./pages/admin/AssignmentManagement";
import DeleteStudent from "./pages/admin/DeleteStudent";

import StudentDashboard, {
  StudentOverview,
} from "./pages/student/StudentDashboard";
import MyAttendance from "./pages/student/MyAttendance";
import MyAssignments from "./pages/student/MyAssignments";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <NotificationProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/student/login" element={<StudentLogin />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="add-student" element={<AddStudent />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="assignments" element={<AssignmentManagement />} />
          <Route path="delete-student" element={<DeleteStudent />} />
        </Route>

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentOverview />} />
          <Route path="attendance" element={<MyAttendance />} />
          <Route path="assignments" element={<MyAssignments />} />
        </Route>

        {/* Fallbacks */}
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        <Route path="/student/*" element={<Navigate to="/student" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </NotificationProvider>
  );
}
