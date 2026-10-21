// client/src/components/Sidebar.jsx
// Reusable sidebar for both Admin and Student dashboards.
// Pass `items` (array of { to, label, icon }), `activeKey` (optional), and `user`.

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ items = [], footerLabel = "Logout" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span
          className="logo"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background:
              "linear-gradient(135deg, var(--indigo-500), var(--purple-500))",
            display: "grid",
            placeItems: "center",
            color: "white",
          }}
        >
          <GraduationCap size={18} />
        </span>
        Smart Attendance
      </div>

      <nav>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {it.icon}
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="spacer" />

      {user && (
        <div
          style={{
            color: "#94a3b8",
            fontSize: 12,
            padding: "0 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: 8,
            marginBottom: 8,
          }}
        >
          Logged in as
          <div
            style={{
              color: "white",
              fontWeight: 600,
              fontSize: 13,
              marginTop: 2,
            }}
          >
            {user.name}
          </div>
          {user.rollNo && (
            <div style={{ fontSize: 11 }}>Roll: {user.rollNo}</div>
          )}
        </div>
      )}

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={16} />
        {footerLabel}
      </button>
    </aside>
  );
}
