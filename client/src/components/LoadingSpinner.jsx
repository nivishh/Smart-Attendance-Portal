// client/src/components/LoadingSpinner.jsx
import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading...", size = 24 }) {
  return (
    <div className="loading-center">
      <Loader2
        size={size}
        color="var(--indigo-500)"
        className="spin"
        style={{ animation: "spin 1s linear infinite" }}
      />
      <div>{label}</div>
    </div>
  );
}
