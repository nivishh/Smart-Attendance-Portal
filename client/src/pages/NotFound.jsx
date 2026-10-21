// client/src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Navbar from "../components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="empty-state" style={{ padding: 80 }}>
        <div className="ico" style={{ width: 80, height: 80 }}>
          <Compass size={36} />
        </div>
        <h2>Page not found</h2>
        <p className="text-muted">
          The page you are looking for does not exist or has moved.
        </p>
        <Link to="/" className="btn mt-3">
          Back to Home
        </Link>
      </div>
    </>
  );
}
