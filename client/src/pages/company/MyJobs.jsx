import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./MyJobs.css";

const API = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function MyJobs() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadJobs = useCallback(async () => {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please sign in to view your jobs.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API}/api/company/jobs`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load your jobs.");
            }
            if (!Array.isArray(data)) {
                throw new Error("The server returned an unexpected jobs response.");
            }

            setJobs(data);
        } catch (loadError) {
            console.error("Company jobs loading error:", loadError);
            setError(loadError.message || "Unable to load your jobs.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    function handleLogout() {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    }

    return (
        <div className="company-jobs-page">
            <header className="company-navbar">
                <Link to="/company/dashboard" className="company-logo">
                    <span className="logo-icon">💼</span>
                    <span>
                        Job<span>Hub</span>
                    </span>
                </Link>

                <nav className="company-nav">
                    <Link className="nav-link" to="/company/dashboard">
                        Dashboard
                    </Link>
                    <Link className="nav-link" to="/company/post-job">
                        ＋ Post Job
                    </Link>
                    <Link className="nav-link active" to="/company/jobs">
                        My Jobs
                    </Link>
                    <Link className="nav-link" to="/company/applications">
                        ▤ Applications
                    </Link>
                </nav>

                <button className="logout-button" onClick={handleLogout}>
                    ↪ Logout
                </button>
            </header>

            <main className="company-jobs-main">
                <section className="company-jobs-heading">
                    <div>
                        <p className="eyebrow">COMPANY WORKSPACE</p>
                        <h1>My Jobs</h1>
                        <p>Track your job postings and their approval status.</p>
                    </div>
                    <Link to="/company/post-job" className="primary-button">
                        + Post a New Job
                    </Link>
                </section>

                <section className="company-jobs-panel">
                    <div className="company-jobs-panel-heading">
                        <div>
                            <h2>Your job postings</h2>
                            <p>
                                {jobs.length}{" "}
                                {jobs.length === 1 ? "job" : "jobs"} submitted
                            </p>
                        </div>
                        <button
                            type="button"
                            className="company-jobs-refresh"
                            onClick={loadJobs}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    {error && (
                        <div className="company-jobs-error" role="alert">
                            <p>{error}</p>
                            <button type="button" onClick={loadJobs}>
                                Try again
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <p className="company-jobs-state">Loading your jobs...</p>
                    ) : !error && jobs.length === 0 ? (
                        <div className="company-jobs-empty">
                            <h2>No jobs posted yet</h2>
                            <p>Your submitted job postings will appear here.</p>
                            <Link
                                to="/company/post-job"
                                className="primary-button"
                            >
                                Post Your First Job
                            </Link>
                        </div>
                    ) : !error ? (
                        <div className="company-jobs-table-wrap">
                            <table className="company-jobs-table">
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Type</th>
                                        <th>Location</th>
                                        <th>Posted</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map((job) => (
                                        <tr key={job.id}>
                                            <td>
                                                <strong>{job.title}</strong>
                                                {job.salary && (
                                                    <small>{job.salary}</small>
                                                )}
                                            </td>
                                            <td>{job.job_type || "—"}</td>
                                            <td>{job.location || "—"}</td>
                                            <td>
                                                {job.created_at
                                                    ? new Date(
                                                          job.created_at
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                            <td>
                                                <span
                                                    className={`company-job-status ${String(
                                                        job.status || "pending"
                                                    ).toLowerCase()}`}
                                                >
                                                    {job.status || "Pending"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </section>
            </main>
        </div>
    );
}
