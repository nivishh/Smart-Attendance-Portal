// client/src/components/Notification.jsx
// Simple toast notification system with context provider + hook.

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const NotifCtx = createContext(null);

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => {
    setItems((arr) => arr.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type, title, message, duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      setItems((arr) => [...arr, { id, type, title, message }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove],
  );

  const api = {
    success: (msg, title = "Success") => push("success", title, msg),
    error: (msg, title = "Error") => push("error", title, msg, 6000),
    warning: (msg, title = "Warning") => push("warning", title, msg),
    info: (msg, title = "Information") => push("info", title, msg),
    remove,
  };

  return (
    <NotifCtx.Provider value={api}>
      {children}
      <div className="notif-stack" role="status" aria-live="polite">
        {items.map((it) => {
          const Icon =
            it.type === "success"
              ? CheckCircle2
              : it.type === "error"
                ? XCircle
                : it.type === "warning"
                  ? AlertTriangle
                  : Info;
          const color =
            it.type === "success"
              ? "var(--success)"
              : it.type === "error"
                ? "var(--danger)"
                : it.type === "warning"
                  ? "var(--warning)"
                  : "var(--info)";
          return (
            <div key={it.id} className={`notif ${it.type}`}>
              <span className="ico">
                <Icon size={18} color={color} />
              </span>
              <div className="body">
                <div className="title">{it.title}</div>
                {it.message && <div className="msg">{it.message}</div>}
              </div>
              <button
                className="close-x"
                onClick={() => remove(it.id)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </NotifCtx.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotifCtx);
  if (!ctx)
    throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
}

export default NotificationProvider;
