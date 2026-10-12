
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CompanyDashboard.css";

const API_URL = "http://localhost:5000";

export default function CompanyDashboard() {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [companyUser, setCompanyUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    });
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(
        companyUser?.name || companyUser?.full_name || ""
    );
    const [profileMessage, setProfileMessage] = useState("");
    const [profileMessageType, setProfileMessageType] = useState("");
    const [savingName, setSavingName] = useState(false);

    useEffect(() => {
        async function loadJobs() {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("token");
                const user = JSON.parse(
                    localStorage.getItem("user") || "null"
                );
                setCompanyUser(user);

                // Check the login session.
                if (!token || !user?.id) {
                    setError(
                        "Your login session was not found. Please sign in again."
                    );
                    return;
                }

                // Allow only company accounts on this dashboard.
                if (
                    user.role &&
                    user.role.toLowerCase() !== "company"
                ) {
                    setError(
                        "Please sign in using a company account."
                    );
                    return;
                }

                // Fetch company jobs using the saved authentication token.
                const response = await fetch(
                    `${API_URL}/api/company/jobs`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.status === 401) {
                    setError(
                        "Your session is invalid or expired. Please sign in again."
                    );
                    return;
                }

                if (response.status === 403) {
                    setError(
                        "You are not authorized to access company jobs."
                    );
                    return;
                }

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || "Could not load your jobs.");
                }

                const data = await response.json();
                if (!Array.isArray(data)) {
                    throw new Error("The server returned an unexpected jobs response.");
                }
                setJobs(data);
            } catch (err) {
                console.error("Company dashboard jobs error:", err);
                setError(
                    err.message ||
                    "Unable to connect to the backend server."
                );
            } finally {
                setLoading(false);
            }
        }

        loadJobs();
    }, []);

    async function handleSaveName(event) {
        event.preventDefault();
        setProfileMessage("");
        setProfileMessageType("");

        const cleanName = nameInput.trim();
        if (!cleanName) {
            setProfileMessage("Please enter your name.");
            setProfileMessageType("error");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            setProfileMessage("Your session has expired. Please sign in again.");
            setProfileMessageType("error");
            return;
        }

        setSavingName(true);

        try {
            const response = await fetch(`${API_URL}/api/account/profile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: cleanName })
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Unable to update your name.");
            }
            if (!data.user) {
                throw new Error("The server did not return your updated profile.");
            }

            setCompanyUser(data.user);
            setNameInput(data.user.name);
            localStorage.setItem("user", JSON.stringify(data.user));
            setEditingName(false);
            setProfileMessage(data.message || "Company name updated.");
            setProfileMessageType("success");
        } catch (saveError) {
            console.error("Company profile update error:", saveError);
            setProfileMessage(saveError.message || "Unable to update your name.");
            setProfileMessageType("error");
        } finally {
            setSavingName(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    }

    const totalJobs = jobs.length;
    const recentJobs = jobs.slice(0, 5);

    const pendingJobs = jobs.filter(
        (job) => job.status === "pending"
    ).length;

    const stats = [
        {
            icon: "💼",
            label: "Total Jobs",
            value: totalJobs,
            color: "blue",
            link: "/company/jobs",
        },
        {
            icon: "📄",
            label: "Applications",
            value: "—",
            color: "purple",
            link: "/company/applications",
        },
        {
            icon: "⭐",
            label: "Shortlisted",
            value: "—",
            color: "green",
            link: "/company/applications",
        },
        {
            icon: "⌛",
            label: "Pending Jobs",
            value: pendingJobs,
            color: "orange",
            link: "/company/jobs",
        },
    ];

    return (
        <div className="company-layout">
            <header className="company-navbar">
                <Link
                    to="/company/dashboard"
                    className="company-logo"
                >
                    <span className="logo-icon">💼</span>
                    <span>
                        Job<span>Hub</span>
                    </span>
                </Link>

                <nav className="company-nav">
                    <Link
                        className="nav-link active"
                        to="/company/dashboard"
                    >
                        Dashboard
                    </Link>

                    <Link
                        className="nav-link"
                        to="/company/post-job"
                    >
                        ＋ Post Job
                    </Link>

                    <Link
                        className="nav-link"
                        to="/company/applications"
                    >
                        ▤ Applications
                    </Link>

                    <Link
                        className="nav-link"
                        to="/company/jobs"
                    >
                        My Jobs
                    </Link>
                </nav>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    ↪ Logout
                </button>
            </header>

            <main className="company-main">
                <section className="company-heading">
                    <div>
                        <p className="eyebrow">
                            COMPANY WORKSPACE
                        </p>

                        <h1>Company Dashboard 🏢</h1>

                        <p>
                            Manage your jobs and find the right candidates.
                        </p>
                    </div>

                    <Link
                        to="/company/post-job"
                        className="primary-button"
                    >
                        + Post a New Job
                    </Link>
                </section>

                <section className="company-account-card">
                    <div className="company-account-avatar">
                        {(companyUser?.name || companyUser?.full_name || "C")
                            .charAt(0)
                            .toUpperCase()}
                    </div>
                    <div className="company-account-details">
                        <span className="company-account-label">
                            COMPANY ACCOUNT
                        </span>
                        {editingName ? (
                            <form
                                className="company-name-form"
                                onSubmit={handleSaveName}
                            >
                                <label htmlFor="company-display-name">
                                    Company name
                                </label>
                                <div className="company-name-controls">
                                    <input
                                        id="company-display-name"
                                        value={nameInput}
                                        onChange={(event) =>
                                            setNameInput(event.target.value)
                                        }
                                        maxLength={100}
                                        autoComplete="organization"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={savingName}
                                    >
                                        {savingName ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        type="button"
                                        className="company-name-cancel"
                                        disabled={savingName}
                                        onClick={() => {
                                            setNameInput(
                                                companyUser?.name ||
                                                    companyUser?.full_name ||
                                                    ""
                                            );
                                            setEditingName(false);
                                            setProfileMessage("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h2>
                                    {companyUser?.name ||
                                        companyUser?.full_name ||
                                        "Company"}
                                </h2>
                                <p>{companyUser?.email || "Email unavailable"}</p>
                            </>
                        )}
                        {profileMessage && (
                            <p
                                className={`company-profile-message ${profileMessageType}`}
                                role={
                                    profileMessageType === "error"
                                        ? "alert"
                                        : "status"
                                }
                            >
                                {profileMessage}
                            </p>
                        )}
                    </div>
                    {!editingName && (
                        <button
                            type="button"
                            className="company-account-edit"
                            onClick={() => {
                                setNameInput(
                                    companyUser?.name ||
                                        companyUser?.full_name ||
                                        ""
                                );
                                setEditingName(true);
                                setProfileMessage("");
                            }}
                        >
                            Change name
                        </button>
                    )}
                </section>

                <section className="stats-grid">
                    {stats.map((stat) => (
                        <Link
                            to={stat.link}
                            className="stat-card"
                            key={stat.label}
                        >
                            <div
                                className={`stat-icon ${stat.color}`}
                            >
                                {stat.icon}
                            </div>

                            <div className="stat-content">
                                <p>{stat.label}</p>
                                <h2>{stat.value}</h2>
                            </div>

                            <span className="stat-arrow">→</span>
                        </Link>
                    ))}
                </section>

                <section className="jobs-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Recent Job Postings</h2>
                            <p>
                                Review the jobs posted by your company.
                            </p>
                        </div>

                        <Link
                            to="/company/jobs"
                            className="text-link"
                        >
                            View all jobs →
                        </Link>
                    </div>

                    {loading && (
                        <p className="state-message">
                            Loading jobs...
                        </p>
                    )}

                    {!loading && error && (
                        <div>
                            <p className="state-message error-message">
                                {error}
                            </p>

                            {(error.includes("sign in") ||
                              error.includes("session")) && (
                                <button
                                    className="primary-button"
                                    onClick={() => navigate("/")}
                                >
                                    Go to Sign In
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && !error && jobs.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>

                            <h3>No jobs posted yet</h3>

                            <p>
                                Create your first job posting to start
                                receiving applications.
                            </p>

                            <Link
                                to="/company/post-job"
                                className="primary-button"
                            >
                                Post Your First Job
                            </Link>
                        </div>
                    )}

                    {!loading && !error && recentJobs.length > 0 && (
                        <div className="table-wrapper">
                            <table className="jobs-table">
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Type</th>
                                        <th>Location</th>
                                        <th>Posted</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentJobs.map((job) => (
                                        <tr key={job.id}>
                                            <td>
                                                <strong>{job.title}</strong>
                                            </td>

                                            <td>
                                                {job.job_type ||
                                                    "Not specified"}
                                            </td>

                                            <td>
                                                {job.location ||
                                                    "Not specified"}
                                            </td>

                                            <td>
                                                {job.created_at
                                                    ? new Date(
                                                          job.created_at
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge ${
                                                        job.status ||
                                                        "pending"
                                                    }`}
                                                >
                                                    {job.status ||
                                                        "pending"}
                                                </span>
                                            </td>

                                            <td>
                                                <Link
                                                    to="/company/applications"
                                                    className="table-action"
                                                >
                                                    View Applications
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
