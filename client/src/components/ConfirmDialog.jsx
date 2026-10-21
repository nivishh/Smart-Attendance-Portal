// client/src/components/ConfirmDialog.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="modal">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="stat-ico"
            style={{
              width: 40,
              height: 40,
              background: danger ? "var(--danger-bg)" : "var(--warning-bg)",
              color: danger ? "var(--danger)" : "var(--warning)",
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <h3 id="confirm-title" style={{ margin: 0 }}>
            {title}
          </h3>
        </div>
        {message && <p>{message}</p>}
        {details && (
          <div
            style={{
              background: "var(--bg-soft)",
              padding: 12,
              borderRadius: 12,
              fontSize: 13,
              color: "var(--text-body)",
              border: "1px solid var(--border-soft)",
            }}
          >
            {details}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={danger ? "btn-danger" : ""} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
