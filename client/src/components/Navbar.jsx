// client/src/components/Navbar.jsx
// Used on landing + auth pages (not inside dashboards — those use Sidebar).

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="app-header">
      <div className="inner">
        <Link to="/" className="brand" style={{ textDecoration: "none" }}>
          <span className="logo">
            <GraduationCap size={20} />
          </span>
          <span>Smart Attendance Portal</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <Link
                to={isAdmin ? "/admin" : "/student"}
                className="btn btn-ghost"
              >
                Dashboard
              </Link>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
          {!isAuthenticated && (
            <>
              <Link to="/admin/login" className="btn btn-ghost">
                Admin
              </Link>
              <Link to="/student/login" className="btn btn-secondary">
                Student
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
