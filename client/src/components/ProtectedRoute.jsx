// client/src/components/ProtectedRoute.jsx
// Guards routes by role. Redirects to login if unauthenticated or unauthorized.

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner label="Verifying session..." />;
  }

  if (!isAuthenticated) {
    const target =
      role === "admin"
        ? "/admin/login"
        : role === "student"
          ? "/student/login"
          : "/";
    return <Navigate to={target} state={{ from: location.pathname }} replace />;
  }

  if (role && user.role !== role) {
    const home =
      user.role === "admin"
        ? "/admin"
        : user.role === "student"
          ? "/student"
          : "/";
    return <Navigate to={home} replace />;
  }

  return children;
}
