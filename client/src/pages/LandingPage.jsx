// client/src/pages/LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  FileText,
} from "lucide-react";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container">
          <h1>Smart Attendance Portal</h1>
          <p className="subtitle">
            Manage attendance, student records, and assignments in one place.
          </p>

          <div className="portal-cards">
            <div className="portal-card admin">
              <div className="icon-wrap">
                <ShieldCheck size={26} />
              </div>
              <h3>Admin Portal</h3>
              <p>
                Add and manage student records, mark daily attendance per
                subject, upload assignments, and remove outdated records — all
                from one clean dashboard.
              </p>
              <Link
                to="/admin/login"
                className="btn"
                style={{ alignSelf: "flex-start" }}
              >
                Enter Portal <ArrowRight size={16} />
              </Link>
            </div>

            <div className="portal-card student">
              <div className="icon-wrap">
                <GraduationCap size={26} />
              </div>
              <h3>Student Portal</h3>
              <p>
                Log in with your roll number to view your attendance records,
                check today's classes, and download assignments shared for your
                class and section.
              </p>
              <Link
                to="/student/login"
                className="btn"
                style={{ alignSelf: "flex-start" }}
              >
                Enter Portal <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginTop: 48 }}>
            <div className="card">
              <CalendarCheck size={22} color="var(--indigo-500)" />
              <h4 style={{ marginTop: 12 }}>Attendance Tracking</h4>
              <p className="text-muted text-sm">
                Subject-wise daily attendance with present/absent marking,
                revision support, and percentage calculations.
              </p>
            </div>
            <div className="card">
              <FileText size={22} color="var(--purple-500)" />
              <h4 style={{ marginTop: 12 }}>Assignment Uploads</h4>
              <p className="text-muted text-sm">
                Upload PDFs and images up to 10 MB. Students only see
                assignments assigned to their class and section.
              </p>
            </div>
            <div className="card">
              <BookOpen size={22} color="var(--navy-700)" />
              <h4 style={{ marginTop: 12 }}>Student Records</h4>
              <p className="text-muted text-sm">
                Add students with unique roll numbers, validate input, and
                safely delete records when students leave.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="app-footer">
        <div className="inner">
          Smart Attendance Portal &middot; Academic Full Stack Project &middot;
          React + Vite + Node + Express
        </div>
      </footer>
    </>
  );
}
