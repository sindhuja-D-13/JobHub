import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import "./StudentDashboard.css";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function StudentDashboard() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [studentName, setStudentName] = useState("Student");
  const [stats, setStats] = useState([
    {
      label: "Available Jobs",
      value: 0,
      icon: "▣",
      color: "blue",
      note: "Explore job opportunities",
    },
    {
      label: "Applications",
      value: 0,
      icon: "▤",
      color: "purple",
      note: "Your submitted applications",
    },
    {
      label: "Selected",
      value: 0,
      icon: "✓",
      color: "green",
      note: "No final selection yet",
    },
  ]);

  const [statsError, setStatsError] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);

  // Get the logged-in student's name and real dashboard statistics.
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setStudentName(user.name || user.full_name || "Student");
      } catch {
        setStudentName("Student");
      }
    }

    async function loadDashboardStats() {
      const token = localStorage.getItem("token");

      if (!token) {
        setStatsError("Please sign in again to view your dashboard.");
        setLoadingStats(false);
        return;
      }

      try {
        const response = await fetch(`${API}/api/student/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load dashboard statistics."
          );
        }

        setStats([
          {
            label: "Available Jobs",
            value: data.availableJobs ?? 0,
            icon: "▣",
            color: "blue",
            note: "Explore job opportunities",
          },
          {
            label: "Applications",
            value: data.applications ?? 0,
            icon: "▤",
            color: "purple",
            note: "Your submitted applications",
          },
          {
            label: "Selected",
            value: data.selected ?? 0,
            icon: "✓",
            color: "green",
            note: data.selection
              ? `${data.selection.job_title} · ${data.selection.company_name}`
              : "No final selection yet",
          },
        ]);

        setStatsError("");
      } catch (error) {
        console.error("Dashboard error:", error);
        setStatsError(error.message || "Unable to load statistics.");
      } finally {
        setLoadingStats(false);
      }
    }

    loadDashboardStats();
  }, []);

  const menu = [
    { name: "Dashboard", icon: "▦", path: "/student/dashboard" },
    { name: "Browse Jobs", icon: "⌕", path: "/student/jobs" },
    { name: "My Applications", icon: "▤", path: "/student/applications" },
    { name: "My Profile", icon: "♙", path: "/student/profile" },
  ];

  function handleMenuClick(item) {
    setActiveMenu(item.name);
    navigate(item.path);
  }

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="student-layout">
      {/* Sidebar */}
      <aside className="student-sidebar">
        <button
          className="dashboard-brand"
          onClick={() => navigate("/student/dashboard")}
        >
          <span className="dashboard-brand-icon">J</span>
          <span>
            JobHub
            <small>CAREER PORTAL</small>
          </span>
        </button>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="student-nav">
          {menu.map((item) => (
            <button
              key={item.name}
              className={`student-nav-item ${
                activeMenu === item.name ? "active" : ""
              }`}
              onClick={() => handleMenuClick(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-help">
          <div className="help-icon">✦</div>
          <strong>Need career help?</strong>
          <p>
            Discover opportunities and take the next step in your career.
          </p>
        </div>

        <button className="sidebar-logout" onClick={signOut}>
          <span>↪</span> Sign out
        </button>
      </aside>

      {/* Main dashboard */}
      <main className="student-main">
        <header className="student-topbar">
          <div className="breadcrumb">
            Workspace / <strong>Dashboard</strong>
          </div>

          <div className="topbar-actions">
            <div className="student-user">
              <div className="user-avatar">
                {studentName.charAt(0).toUpperCase()}
              </div>

              <div className="user-details">
                <strong>{studentName}</strong>
                <span>Job seeker</span>
              </div>
            </div>
          </div>
        </header>

        <div className="student-content">
          {/* Welcome section */}
          <section className="student-welcome">
            <div>
              <div className="welcome-date">YOUR CAREER WORKSPACE</div>

              <h1>
                Welcome back, {studentName}! <span>👋</span>
              </h1>

              <p>
                Track your applications and explore approved job opportunities.
              </p>
            </div>

            <div className="welcome-decoration"></div>
          </section>

          {/* Live statistics */}
          <section className="student-stats">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>

                <div className="stat-label">{stat.label}</div>

                <div className="stat-value">
                  {loadingStats ? "..." : stat.value}
                </div>

                <div className="stat-note">{stat.note}</div>
              </article>
            ))}
          </section>

          {statsError && (
            <div className="dashboard-error" role="alert">
              <p>{statsError}</p>
              <button onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          <footer className="student-footer">
            <span>© 2026 JobHub</span>
            <span>Build your future, one application at a time.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
