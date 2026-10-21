// client/src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../components/Notification";
import { authApi, errorMessage } from "../api/api";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotification();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await authApi.adminLogin(username, password);
      login(resp.token, resp.user);
      notify.success("Welcome back, Administrator.");
      const dest = location.state?.from?.startsWith("/admin")
        ? location.state.from
        : "/admin";
      navigate(dest, { replace: true });
    } catch (err) {
      notify.error(errorMessage(err, "Invalid admin credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, var(--navy-700), var(--indigo-500))",
                display: "grid",
                placeItems: "center",
                color: "white",
              }}
            >
              <ShieldCheck size={26} />
            </div>
          </div>
          <h2>Admin Login</h2>
          <p className="sub">
            Sign in to manage students, attendance and assignments.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Signing in..." : "Sign In as Admin"}
            </button>
          </form>

          <div
            className="card mt-4"
            style={{ background: "var(--bg-soft)", padding: 12, fontSize: 13 }}
          >
            <strong>Demo credentials:</strong>
            <div>
              Username: <code>admin</code>
            </div>
            <div>
              Password: <code>admin123</code>
            </div>
          </div>

          <div className="alt-link">
            <Link to="/">
              <ArrowLeft size={14} /> Back to home
            </Link>
            &nbsp;&middot;&nbsp;
            <Link to="/student/login">Student login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
