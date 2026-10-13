import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
).replace(/\/+$/, "");

export default function JobApprovals() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);

    const loadJobs = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please sign in first.");
            }

            const response = await fetch(`${API}/api/admin/jobs/pending`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Your session may have expired. Please sign in again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "You do not have permission to review jobs."
                    );
                }

                throw new Error(data.message || "Unable to load jobs.");
            }

            if (!Array.isArray(data)) {
                throw new Error("Unexpected response from the server.");
            }

            setJobs(data);
        } catch (err) {
            console.error("Pending jobs loading error:", err);
            setError(err.message || "Unable to load jobs. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    async function updateStatus(jobId, status) {
        const action = status === "approved" ? "approve" : "reject";

        if (!window.confirm(`Are you sure you want to ${action} this job?`)) {
            return;
        }

        setBusyId(jobId);
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please sign in first.");
            }

            const response = await fetch(
                `${API}/api/admin/jobs/${jobId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Your session may have expired. Please sign in again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "You do not have permission to change this job's status."
                    );
                }

                throw new Error(data.message || "Unable to update job.");
            }

            setJobs((previous) =>
                previous.filter((job) => job.id !== jobId)
            );
        } catch (err) {
            console.error("Job status update error:", err);
            setError(err.message || "Unable to update job. Please try again.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <Link to="/admin" className="admin-logo">
                    Job<span>Hub</span>
                </Link>

                <nav className="admin-nav">
                    <Link to="/admin">🏠 Dashboard</Link>
                    <Link to="/admin/job-approvals" className="active">
                        ✅ Job Approvals
                    </Link>
                    <Link to="/admin/shortlist-approvals">
                        ⭐ Shortlist Approvals
                    </Link>
                    <Link to="/admin/students">🎓 Students</Link>
                    <Link to="/admin/companies">🏢 Companies</Link>
                    <Link to="/admin/applications">📄 Applications</Link>
                </nav>

                <div className="admin-welcome">
                    <div className="welcome-icon">📋</div>
                    <h3>Job Reviews</h3>
                    <p>Review company job submissions before publishing.</p>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>
                            Job <span>Approvals</span> ✅
                        </h1>
                        <p>Review and manage jobs submitted by companies.</p>
                    </div>

                    <button
                        type="button"
                        className="admin-btn"
                        onClick={loadJobs}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "↻ Refresh"}
                    </button>
                </header>

                <section className="admin-stats">
                    <div className="admin-stat-card jobs">
                        <div className="admin-stat-top">
                            <div className="admin-stat-icon">⏳</div>
                            <div>
                                <h3>Pending Jobs</h3>
                                <p className="stat-value">
                                    {loading ? "..." : jobs.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="admin-error" role="alert">
                        <p>{error}</p>
                        <button
                            type="button"
                            className="admin-btn"
                            onClick={loadJobs}
                            disabled={loading}
                        >
                            Try again
                        </button>
                    </div>
                )}

                <section className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h2>Pending Submissions</h2>
                            <p>Approve jobs to make them visible to students.</p>
                        </div>
                    </div>

                    {loading ? (
                        <p>Loading pending jobs...</p>
                    ) : error ? null : jobs.length === 0 ? (
                        <div className="admin-empty">
                            <span>🎉</span>
                            <h3>No pending jobs</h3>
                            <p>All submitted jobs have been reviewed.</p>
                        </div>
                    ) : (
                        <div className="admin-record-list">
                            {jobs.map((job) => (
                                <article className="admin-record" key={job.id}>
                                    <div className="admin-record-heading">
                                        <div>
                                            <h3>{job.title || "Untitled job"}</h3>
                                            <p>
                                                {job.company_name || "Company"}
                                                {job.location
                                                    ? ` • ${job.location}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <span className="admin-badge pending">
                                            Pending
                                        </span>
                                    </div>

                                    <p className="admin-record-description">
                                        {job.description || "No description provided."}
                                    </p>

                                    <div className="admin-record-meta">
                                        <span>
                                            💼 {job.job_type || "Not specified"}
                                        </span>
                                        <span>
                                            💰 {job.salary || "Not specified"}
                                        </span>
                                    </div>

                                    {job.skills && (
                                        <p className="admin-record-skills">
                                            <strong>Skills:</strong> {job.skills}
                                        </p>
                                    )}

                                    <div className="admin-record-actions">
                                        <button
                                            type="button"
                                            className="admin-btn"
                                            disabled={busyId === job.id}
                                            onClick={() =>
                                                updateStatus(job.id, "approved")
                                            }
                                        >
                                            {busyId === job.id
                                                ? "Processing..."
                                                : "✓ Approve"}
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-btn admin-btn-danger"
                                            disabled={busyId === job.id}
                                            onClick={() =>
                                                updateStatus(job.id, "rejected")
                                            }
                                        >
                                            {busyId === job.id
                                                ? "Processing..."
                                                : "✕ Reject"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
