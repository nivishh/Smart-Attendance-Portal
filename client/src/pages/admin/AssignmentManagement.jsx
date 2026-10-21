// client/src/pages/admin/AssignmentManagement.jsx
import React, { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Image as ImageIcon,
  File,
  AlertCircle,
  Eye,
} from "lucide-react";
import { studentApi, assignmentApi, errorMessage } from "../../api/api";
import { useNotification } from "../../components/Notification";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  formatDate,
  formatFileSize,
  isImageFile,
  isPdfFile,
} from "../../utils/formatters";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EMPTY = {
  title: "",
  subject: "",
  className: "",
  section: "",
  description: "",
  dueDate: "",
};

const SUBJECTS = [
  "Web Technology",
  "Data Structures",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Software Engineering",
  "Machine Learning",
  "Artificial Intelligence",
  "Compiler Design",
  "Cloud Computing",
];

export default function AssignmentManagement() {
  const notify = useNotification();
  const [meta, setMeta] = useState({ classes: [], sections: [] });
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    studentApi
      .meta()
      .then(setMeta)
      .catch(() => {});
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoadingList(true);
    try {
      const resp = await assignmentApi.list();
      setAssignments(resp.assignments || []);
    } catch (err) {
      notify.error(errorMessage(err, "Failed to load assignments."));
    } finally {
      setLoadingList(false);
    }
  };

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      notify.error(
        `File too large. Max size is 10 MB. Your file is ${(f.size / 1024 / 1024).toFixed(2)} MB.`,
      );
      e.target.value = "";
      return;
    }
    const lower = f.name.toLowerCase();
    const ok = isImageFile(lower) || isPdfFile(lower);
    if (!ok) {
      notify.error(
        "Unsupported file type. Allowed: PDF, JPG, JPEG, PNG, WEBP.",
      );
      e.target.value = "";
      return;
    }
    setFile(f);
    if (isImageFile(lower)) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl("");
    }
    setErrors((er) => ({ ...er, file: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.title.trim()) er.title = "Title is required.";
    if (!form.subject) er.subject = "Subject is required.";
    if (!form.className) er.className = "Class is required.";
    if (!form.section) er.section = "Section is required.";
    if (!form.dueDate) er.dueDate = "Due date is required.";
    if (!file) er.file = "Please select a file to upload.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!validate()) {
      notify.warning("Please complete the form and select a file.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("subject", form.subject);
      fd.append("className", form.className);
      fd.append("section", form.section);
      fd.append("description", form.description.trim());
      fd.append("dueDate", form.dueDate);
      fd.append("file", file);

      const resp = await assignmentApi.upload(fd);
      notify.success(
        `Assignment "${resp.assignment.title}" uploaded successfully.`,
      );
      setForm(EMPTY);
      setFile(null);
      setPreviewUrl("");
      const fi = document.getElementById("file");
      if (fi) fi.value = "";
      await loadAssignments();
    } catch (err) {
      notify.error(errorMessage(err, "Failed to upload assignment."));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (a) => {
    const url = assignmentApi.downloadUrl(a.id);
    const token = localStorage.getItem("sap_token");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error("Download failed");
        return r.blob();
      })
      .then((b) => {
        const u = URL.createObjectURL(b);
        const link = document.createElement("a");
        link.href = u;
        link.download = a.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(u);
      })
      .catch(() => notify.error("Failed to download file."));
  };

  const handleView = (a) => {
    const url = assignmentApi.downloadUrl(a.id);
    const token = localStorage.getItem("sap_token");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => {
        const u = URL.createObjectURL(b);
        window.open(u, "_blank");
        setTimeout(() => URL.revokeObjectURL(u), 60000);
      })
      .catch(() => notify.error("Failed to open file."));
  };

  const handleDeleteClick = (a) => setToDelete(a);
  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    try {
      await assignmentApi.remove(toDelete.id);
      notify.success(`Assignment "${toDelete.title}" deleted.`);
      await loadAssignments();
    } catch (err) {
      notify.error(errorMessage(err, "Failed to delete assignment."));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 24 }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ margin: 0 }}>Upload Assignment</h2>
            <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
              Upload PDF or image files (max 10 MB). Students see only
              assignments matching their class and section.
            </p>
          </div>
          <div className="badge purple">
            <Upload size={14} /> New Upload
          </div>
        </div>

        <form onSubmit={handleUpload} noValidate>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="title">Assignment Title *</label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={update("title")}
                placeholder="e.g. Lab Assignment 3 — DOM Manipulation"
              />
              {errors.title && <div className="error">{errors.title}</div>}
            </div>
            <div className="field">
              <label htmlFor="subject">Subject / Course *</label>
              <select
                id="subject"
                value={form.subject}
                onChange={update("subject")}
              >
                <option value="">— Select Subject —</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.subject && <div className="error">{errors.subject}</div>}
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
              <label htmlFor="dueDate">Due Date *</label>
              <input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={update("dueDate")}
              />
              {errors.dueDate && <div className="error">{errors.dueDate}</div>}
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={update("description")}
                placeholder="Brief instructions for the assignment..."
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="file">
              Upload File *{" "}
              <span className="text-muted text-sm">
                (PDF, JPG, JPEG, PNG, WEBP — max 10 MB)
              </span>
            </label>
            <label className="file-drop" htmlFor="file">
              <div className="ico">
                <Upload size={28} />
              </div>
              <div>{file ? file.name : "Click to select a file"}</div>
              <div className="hint">
                {file
                  ? `Size: ${formatFileSize(file.size)}`
                  : "Or drag and drop a file here"}
              </div>
              <input
                id="file"
                type="file"
                style={{ display: "none" }}
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                onChange={handleFileChange}
              />
            </label>
            {errors.file && <div className="error">{errors.file}</div>}
            {previewUrl && (
              <div className="file-preview">
                <img src={previewUrl} alt="preview" />
                <div>
                  <div style={{ fontWeight: 600 }}>{file?.name}</div>
                  <div className="text-muted text-sm">Image preview</div>
                </div>
              </div>
            )}
            {file && isPdfFile(file.name) && (
              <div className="file-preview">
                <File size={32} color="var(--danger)" />
                <div>
                  <div style={{ fontWeight: 600 }}>{file.name}</div>
                  <div className="text-muted text-sm">
                    PDF file &middot; {formatFileSize(file.size)} &middot; Link
                    will be available after upload.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={uploading}>
              <Upload size={16} />{" "}
              {uploading ? "Uploading..." : "Upload Assignment"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ margin: 0 }}>Uploaded Assignments</h2>
          <button
            className="btn-secondary"
            onClick={loadAssignments}
            disabled={loadingList}
          >
            Refresh
          </button>
        </div>

        {loadingList ? (
          <LoadingSpinner label="Loading assignments..." />
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <div className="ico">
              <AlertCircle size={28} />
            </div>
            <h4>No assignments yet</h4>
            <p className="text-muted text-sm">
              Upload your first assignment using the form above.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Subject</th>
                    <th>Class / Section</th>
                    <th>Uploaded</th>
                    <th>Due Date</th>
                    <th>File</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.title}</strong>
                        {a.description && (
                          <div
                            className="text-muted text-sm"
                            style={{ maxWidth: 260 }}
                          >
                            {a.description}
                          </div>
                        )}
                      </td>
                      <td>{a.subject}</td>
                      <td>
                        {a.className}
                        <br />
                        <span className="text-muted text-sm">
                          Sec {a.section}
                        </span>
                      </td>
                      <td>{formatDate(a.uploadedAt)}</td>
                      <td>{formatDate(a.dueDate)}</td>
                      <td>
                        <span className="badge info">
                          {isPdfFile(a.fileName) ? (
                            <>
                              <File size={12} /> PDF
                            </>
                          ) : (
                            <>
                              <ImageIcon size={12} /> Image
                            </>
                          )}
                        </span>
                        <div className="text-muted text-sm mt-2">
                          {formatFileSize(a.fileSize)}
                        </div>
                      </td>
                      <td>
                        <div
                          className="flex gap-2"
                          style={{ flexWrap: "wrap" }}
                        >
                          <button
                            className="btn-secondary"
                            onClick={() => handleView(a)}
                            title="Open / Preview"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => handleDownload(a)}
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteClick(a)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete assignment?"
        message="This will permanently remove the assignment and its file from the server."
        details={
          toDelete
            ? `${toDelete.title} — ${toDelete.subject} (${toDelete.className} / ${toDelete.section})`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
