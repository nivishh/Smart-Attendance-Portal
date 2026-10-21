// client/src/pages/admin/AddStudent.jsx
import React, { useEffect, useState } from "react";
import { UserPlus, RotateCcw, Save } from "lucide-react";
import { studentApi, errorMessage } from "../../api/api";
import { useNotification } from "../../components/Notification";

const EMPTY = {
  fullName: "",
  rollNo: "",
  className: "",
  section: "",
  branch: "",
  course: "B.Tech",
  email: "",
  phone: "",
  password: "", // NEW field — empty means "use default student123"
};

export default function AddStudent() {
  const notify = useNotification();
  const [meta, setMeta] = useState({
    classes: [],
    sections: [],
    branches: [],
    courses: [],
  });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    studentApi
      .meta()
      .then(setMeta)
      .catch(() => {});
  }, []);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.fullName.trim()) er.fullName = "Full name is required.";
    if (!form.rollNo.trim()) er.rollNo = "Roll number is required.";
    if (!form.className) er.className = "Please select a class.";
    if (!form.section) er.section = "Please select a section.";
    if (!form.branch) er.branch = "Please select a branch.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      er.email = "Invalid email format.";
    if (form.phone && !/^[+]?[\d\s\-()]{7,15}$/.test(form.phone))
      er.phone = "Invalid phone number.";
    if (form.password && form.password.length < 6)
      er.password = "Password must be at least 6 characters.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      notify.warning("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        rollNo: form.rollNo.trim(),
        className: form.className,
        section: form.section,
        branch: form.branch,
        course: form.course,
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      // Only send password if admin typed one. Empty = backend uses default student123.
      if (form.password && form.password.trim()) {
        payload.password = form.password.trim();
      }
      const resp = await studentApi.create(payload);
      const msg = form.password
        ? `Student record added! Login password set to your custom value.`
        : `Student record added! Default login password is "student123".`;
      notify.success(msg);
      setForm(EMPTY);
      setErrors({});
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setErrors((er) => ({
          ...er,
          rollNo: "This roll number already exists.",
        }));
        notify.error("A student with this roll number already exists.");
      } else {
        notify.error(errorMessage(err, "Failed to save student record."));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(EMPTY);
    setErrors({});
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>Add Student</h2>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            Fill in the form below. Roll numbers must be unique. Leave the
            password field blank to use the default <code>student123</code>, or
            type a custom password (min 6 characters).
          </p>
        </div>
        <div className="badge info">
          <UserPlus size={14} /> New Record
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="fullName">Student Full Name *</label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={update("fullName")}
              placeholder="e.g. Aarav Sharma"
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && <div className="error">{errors.fullName}</div>}
          </div>

          <div className="field">
            <label htmlFor="rollNo">Roll Number *</label>
            <input
              id="rollNo"
              type="text"
              value={form.rollNo}
              onChange={update("rollNo")}
              placeholder="e.g. 101"
              aria-invalid={!!errors.rollNo}
            />
            {errors.rollNo && <div className="error">{errors.rollNo}</div>}
          </div>

          <div className="field">
            <label htmlFor="className">Class *</label>
            <select
              id="className"
              value={form.className}
              onChange={update("className")}
            >
              <option value="">— Select Class —</option>
              {meta.classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.className && (
              <div className="error">{errors.className}</div>
            )}
          </div>

          <div className="field">
            <label htmlFor="section">Section *</label>
            <select
              id="section"
              value={form.section}
              onChange={update("section")}
            >
              <option value="">— Select Section —</option>
              {meta.sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.section && <div className="error">{errors.section}</div>}
          </div>

          <div className="field">
            <label htmlFor="branch">Branch *</label>
            <select id="branch" value={form.branch} onChange={update("branch")}>
              <option value="">— Select Branch —</option>
              {meta.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {errors.branch && <div className="error">{errors.branch}</div>}
          </div>

          <div className="field">
            <label htmlFor="course">Course / Programme</label>
            <select id="course" value={form.course} onChange={update("course")}>
              {meta.courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="e.g. aarav@example.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>

          <div className="field">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              placeholder="e.g. +91 98765 43210"
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <div className="error">{errors.phone}</div>}
          </div>

          {/* NEW: Optional custom password field */}
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="password">
              Login Password{" "}
              <span className="text-muted text-sm">
                (optional — leave blank to use default <code>student123</code>)
              </span>
            </label>
            <input
              id="password"
              type="text"
              value={form.password}
              onChange={update("password")}
              placeholder="Leave blank for default, or type a custom password (min 6 chars)"
              autoComplete="off"
              aria-invalid={!!errors.password}
            />
            {errors.password && <div className="error">{errors.password}</div>}
            <div className="hint">
              Tip: give each student a unique password so they don't share
              credentials.
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            <RotateCcw size={16} /> Reset Form
          </button>
          <button type="submit" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save Student"}
          </button>
        </div>
      </form>
    </div>
  );
}
