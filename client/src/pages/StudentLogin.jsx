import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, ArrowLeft } from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../components/Notification";
import { authApi, errorMessage } from "../api/api";

export default function StudentLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotification();

  const [rollNo, setRollNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const trimmedRollNo = rollNo.trim();

    if (!trimmedRollNo || !password) {
      notify.error("Please enter your roll number and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.studentLogin(trimmedRollNo, password);

      if (!response?.token || !response?.user) {
        throw new Error("Invalid response received from the server.");
      }

      if (response.user.role !== "student") {
        throw new Error("This account is not registered as a student.");
      }

      login(response.token, response.user);

      notify.success(`Welcome, ${response.user.name}!`);

      const requestedPath = location.state?.from;

      const destination =
        typeof requestedPath === "string" &&
        requestedPath.startsWith("/student")
          ? requestedPath
          : "/student";

      navigate(destination, { replace: true });
    } catch (error) {
      notify.error(
        errorMessage(
          error,
          "Login failed. Please check your roll number and password.",
        ),
      );
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
                  "linear-gradient(135deg, var(--purple-500), var(--indigo-400))",
                display: "grid",
                placeItems: "center",
                color: "white",
              }}
            >
              <GraduationCap size={26} />
            </div>
          </div>

          <h2>Student Login</h2>

          <p className="sub">
            Use your roll number and password to access your student portal.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="rollNo">Roll Number</label>

              <input
                id="rollNo"
                name="rollNo"
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="Enter your roll number"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Signing in..." : "Sign In as Student"}
            </button>
          </form>

          <div
            className="card mt-4"
            style={{
              background: "var(--bg-soft)",
              padding: 12,
              fontSize: 13,
            }}
          >
            <strong>Demo credentials</strong>

            <div>
              Roll No: <code>Use the roll number registered by the admin</code>
            </div>

            <div>
              Password: <code>student123</code>
            </div>

            <p style={{ marginBottom: 0, marginTop: 8 }}>
              The default password works only if your backend assigns it to
              newly created student accounts.
            </p>
          </div>

          <div className="alt-link">
            <Link to="/">
              <ArrowLeft size={14} />
              Back to home
            </Link>
            &nbsp;·&nbsp;
            <Link to="/admin/login">Admin login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
