
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API = "http://localhost:5000";

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        students: 0,
        companies: 0,
        pendingJobs: 0,
        pendingShortlists: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Sign out safely
    function handleSignOut() {
        const confirmed = window.confirm(
            "Are you sure you want to sign out?"
        );

        if (!confirmed) return;

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/", { replace: true });
    }

    // Load dashboard data
    useEffect(() => {
        const controller = new AbortController();

        async function loadDashboard() {
            const token = localStorage.getItem("token");

            // Redirect when the user is not signed in
            if (!token) {
                navigate("/", {
                    replace: true,
                    state: {
                        message: "Please sign in to access the admin dashboard."
                    }
                });
                return;
            }

            try {
                const response = await fetch(
                    `${API}/api/admin/dashboard`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        signal: controller.signal
                    }
                );

                const data = await response.json();

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    navigate("/", {
                        replace: true,
                        state: {
                            message: "Your session expired. Please sign in again."
                        }
                    });
                    return;
                }

                if (response.status === 403) {
                    setError(
                        "Your account does not have administrator access."
                    );
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load dashboard."
                    );
                }

                setStats(data);
            } catch (err) {
                if (err.name === "AbortError") return;

                setError(
                    err.message ||
                    "Unable to connect to the server. Check your backend."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => controller.abort();
    }, [navigate]);

    const cards = [
        {
            title: "Total Students",
            value: stats.students,
            icon: "🎓",
            className: "students",
            description: "Registered student accounts"
        },
        {
            title: "Total Companies",
            value: stats.companies,
            icon: "🏢",
            className: "companies",
            description: "Registered company accounts"
        },
        {
            title: "Pending Jobs",
            value: stats.pendingJobs,
            icon: "⏳",
            className: "jobs",
            description: "Jobs awaiting approval",
            link: "/admin/job-approvals"
        },
        {
            title: "Pending Shortlists",
            value: stats.pendingShortlists,
            icon: "⭐",
            className: "shortlists",
            description: "Shortlists awaiting review",
            link: "/admin/shortlist-approvals"
        }
    ];

    const actions = [
        {
            title: "Review Pending Jobs",
            icon: "✅",
            link: "/admin/job-approvals"
        },
        {
            title: "Review Shortlists",
            icon: "⭐",
            link: "/admin/shortlist-approvals"
        },
        {
            title: "Manage Students",
            icon: "🎓",
            link: "/admin/students"
        },
        {
            title: "Manage Companies",
            icon: "🏢",
            link: "/admin/companies"
        },
        {
            title: "View Applications",
            icon: "📄",
            link: "/admin/applications"
        }
    ];

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <Link to="/admin" className="admin-logo">
                    Job<span>Hub</span>
                </Link>

                <nav className="admin-nav">
                    <Link to="/admin" className="active">
                        <span className="nav-icon">🏠</span>
                        Dashboard
                    </Link>

                    <Link to="/admin/job-approvals">
                        <span className="nav-icon">✅</span>
                        Job Approvals
                    </Link>

                    <Link to="/admin/shortlist-approvals">
                        <span className="nav-icon">⭐</span>
                        Shortlist Approvals
                    </Link>

                    <Link to="/admin/students">
                        <span className="nav-icon">🎓</span>
                        Students
                    </Link>

                    <Link to="/admin/companies">
                        <span className="nav-icon">🏢</span>
                        Companies
                    </Link>

                    <Link to="/admin/applications">
                        <span className="nav-icon">📄</span>
                        Applications
                    </Link>
                </nav>

                <button
                    type="button"
                    className="admin-signout"
                    onClick={handleSignOut}
                >
                    <span className="signout-icon">↪</span>
                    <span>Sign Out</span>
                </button>

                <div className="admin-welcome">
                    <div className="welcome-icon">👋</div>
                    <h3>Hello, Admin!</h3>
                    <p>Manage and grow JobHub efficiently.</p>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>
                            Admin <span>Dashboard</span> 👨‍💼
                        </h1>
                        <p>
                            Manage jobs, companies, students and approvals
                            all in one place.
                        </p>
                    </div>

                    <div className="admin-header-actions">
                        <div className="admin-profile">
                            <div className="admin-avatar">👨‍💼</div>
                            <div>
                                <strong>Admin</strong>
                                <small>Administrator</small>
                            </div>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="admin-error" role="alert">
                        {error}
                    </div>
                )}

                <section className="admin-stats">
                    {cards.map((card) => {
                        const content = (
                            <>
                                <div className="admin-stat-top">
                                    <div className="admin-stat-icon">
                                        {card.icon}
                                    </div>

                                    <div>
                                        <h3>{card.title}</h3>
                                        <p className="stat-value">
                                            {loading ? "..." : card.value}
                                        </p>
                                    </div>
                                </div>

                                <p className="stat-description">
                                    {card.description}
                                </p>
                            </>
                        );

                        return card.link ? (
                            <Link
                                to={card.link}
                                key={card.title}
                                className={`admin-stat-card ${card.className}`}
                            >
                                {content}
                            </Link>
                        ) : (
                            <div
                                key={card.title}
                                className={`admin-stat-card ${card.className}`}
                            >
                                {content}
                            </div>
                        );
                    })}
                </section>

                <section className="admin-content-grid">
                    <div className="admin-panel">
                        <div className="admin-panel-header">
                            <div>
                                <h2>Welcome to JobHub</h2>
                                <p>
                                    Your central workspace for managing
                                    recruitment activity.
                                </p>
                            </div>
                        </div>

                        <div className="admin-overview">
                            <div className="overview-icon">🚀</div>
                            <h3>Everything in one place</h3>
                            <p>
                                Review submitted jobs, manage registered
                                users, and monitor applications from your
                                administration dashboard.
                            </p>

                            <Link
                                to="/admin/job-approvals"
                                className="admin-btn"
                            >
                                Review Pending Jobs →
                            </Link>
                        </div>
                    </div>

                    <div className="admin-panel">
                        <div className="admin-panel-header">
                            <div>
                                <h2>Quick Actions</h2>
                                <p>Navigate to an admin section.</p>
                            </div>
                        </div>

                        <div className="admin-quick-actions">
                            {actions.map((action) => (
                                <Link
                                    key={action.title}
                                    to={action.link}
                                    className="admin-action-card"
                                >
                                    <span className="admin-action-icon">
                                        {action.icon}
                                    </span>

                                    <strong>{action.title}</strong>

                                    <span className="admin-action-arrow">
                                        →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="admin-panel admin-bottom-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h2>Administration Overview</h2>
                            <p>
                                Choose a section to continue managing JobHub.
                            </p>
                        </div>
                    </div>

                    <div className="admin-overview-links">
                        <Link to="/admin/job-approvals">
                            <span>📋</span>
                            <div>
                                <strong>Job Submissions</strong>
                                <small>
                                    Approve or reject submitted jobs
                                </small>
                            </div>
                            <span className="admin-action-arrow">→</span>
                        </Link>

                        <Link to="/admin/students">
                            <span>🎓</span>
                            <div>
                                <strong>Student Directory</strong>
                                <small>Manage student accounts</small>
                            </div>
                            <span className="admin-action-arrow">→</span>
                        </Link>

                        <Link to="/admin/companies">
                            <span>🏢</span>
                            <div>
                                <strong>Company Directory</strong>
                                <small>View registered companies</small>
                            </div>
                            <span className="admin-action-arrow">→</span>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
