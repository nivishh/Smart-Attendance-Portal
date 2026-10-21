// client/src/api/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const http = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("sap_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status;
    const url = error.config?.url || "";
    if (status === 401 && !url.includes("/auth/")) {
      localStorage.removeItem("sap_token");
      localStorage.removeItem("sap_user");
      if (
        window.location.pathname !== "/" &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(
  err,
  fallback = "Something went wrong. Please try again.",
) {
  if (!err) return fallback;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.errors?.length)
    return err.response.data.errors.join(" ");
  if (err.message === "Network Error")
    return "Cannot reach the server. Is the backend running on port 5000?";
  if (err.message) return err.message;
  return fallback;
}

// ====== AUTH ======
export const authApi = {
  adminLogin: (username, password) =>
    http
      .post("/api/auth/admin-login", { username, password })
      .then((r) => r.data),
  studentLogin: (rollNo, password) =>
    http
      .post("/api/auth/student-login", { rollNo, password })
      .then((r) => r.data),
  me: () => http.get("/api/auth/me").then((r) => r.data),
  logout: () => http.post("/api/auth/logout").then((r) => r.data),
  // NEW: student changes own password
  changePassword: (currentPassword, newPassword) =>
    http
      .post("/api/auth/change-password", { currentPassword, newPassword })
      .then((r) => r.data),
};

// ====== STUDENTS ======
export const studentApi = {
  meta: () => http.get("/api/students/meta").then((r) => r.data),
  list: () => http.get("/api/students").then((r) => r.data),
  get: (rollNo) => http.get(`/api/students/${rollNo}`).then((r) => r.data),
  create: (data) => http.post("/api/students", data).then((r) => r.data),
  remove: (rollNo) =>
    http.delete(`/api/students/${rollNo}`).then((r) => r.data),
  // NEW: admin resets a student's password
  resetPassword: (rollNo, newPassword) =>
    http
      .post(`/api/students/${rollNo}/reset-password`, { newPassword })
      .then((r) => r.data),
};

// ====== ATTENDANCE ======
export const attendanceApi = {
  query: ({ subject, className, section, date }) =>
    http
      .get("/api/attendance", { params: { subject, className, section, date } })
      .then((r) => r.data),
  today: () => http.get("/api/attendance/today").then((r) => r.data),
  byStudent: (rollNo) =>
    http.get(`/api/attendance/student/${rollNo}`).then((r) => r.data),
  bulkSave: (payload) =>
    http.post("/api/attendance/bulk", payload).then((r) => r.data),
};

// ====== ASSIGNMENTS ======
export const assignmentApi = {
  list: () => http.get("/api/assignments").then((r) => r.data),
  studentAssignments: () =>
    http.get("/api/assignments/student").then((r) => r.data),
  get: (id) => http.get(`/api/assignments/${id}`).then((r) => r.data),
  upload: (formData) =>
    http
      .post("/api/assignments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      })
      .then((r) => r.data),
  remove: (id) => http.delete(`/api/assignments/${id}`).then((r) => r.data),
  downloadUrl: (id) => `${API_BASE}/api/assignments/${id}/download`,
};

export default http;
