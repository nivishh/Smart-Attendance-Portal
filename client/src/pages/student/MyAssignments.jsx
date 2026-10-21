// client/src/pages/student/MyAssignments.jsx
import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Image as ImageIcon,
  File,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import { assignmentApi, errorMessage } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../components/Notification";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  formatDate,
  formatFileSize,
  isImageFile,
  isPdfFile,
} from "../../utils/formatters";

export default function MyAssignments() {
  const { user } = useAuth();
  const notify = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await assignmentApi.studentAssignments();
        if (mounted) setAssignments(resp.assignments || []);
      } catch (err) {
        notify.error(errorMessage(err, "Failed to load assignments."));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

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

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>My Assignments</h2>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            Assignments shared for {user?.className || "your class"} - Section{" "}
            {user?.section || "—"}.
          </p>
        </div>
        <div className="badge purple">
          <FileText size={14} /> Assignments
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading assignments..." />
      ) : assignments.length === 0 ? (
        <div className="empty-state">
          <div className="ico">
            <AlertCircle size={28} />
          </div>
          <h4>No assignments found</h4>
          <p className="text-muted text-sm">
            Your teachers haven't uploaded any assignments for your class and
            section yet. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-2">
          {assignments.map((a) => {
            const isImg = isImageFile(a.fileName);
            const isPdf = isPdfFile(a.fileName);
            const due = new Date(a.dueDate);
            const isOverdue = due < new Date(new Date().toDateString());
            return (
              <div key={a.id} className="assign-card">
                <div className="title-row">
                  <div>
                    <h4>{a.title}</h4>
                    <div className="meta">
                      <span className="badge info">{a.subject}</span>
                      <span>
                        {a.className} / Sec {a.section}
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${isOverdue ? "absent" : "purple"}`}>
                    {isPdf ? (
                      <>
                        <File size={12} /> PDF
                      </>
                    ) : (
                      <>
                        <ImageIcon size={12} /> Image
                      </>
                    )}
                  </span>
                </div>

                {a.description && <div className="desc">{a.description}</div>}

                <div
                  className="meta"
                  style={{ justifyContent: "space-between" }}
                >
                  <span>
                    <strong>Uploaded:</strong> {formatDate(a.uploadedAt)}
                  </span>
                  <span
                    className={isOverdue ? "" : "text-muted"}
                    style={{ color: isOverdue ? "var(--danger)" : "" }}
                  >
                    <CalendarClock
                      size={14}
                      style={{ verticalAlign: "middle", marginRight: 4 }}
                    />
                    <strong>Due:</strong> {formatDate(a.dueDate)}
                    {isOverdue && " (overdue)"}
                  </span>
                </div>

                <div className="meta">
                  <span>{formatFileSize(a.fileSize)}</span>
                  <span>{a.fileName}</span>
                </div>

                <div className="actions">
                  <button
                    className="btn-secondary"
                    onClick={() => handleView(a)}
                  >
                    <Eye size={14} /> Open / Preview
                  </button>
                  <button onClick={() => handleDownload(a)}>
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
