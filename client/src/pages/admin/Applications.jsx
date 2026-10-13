
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
).replace(/\/+$/, "");

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please sign in first.");
            }

            const response = await fetch(
                `${API}/api/admin/applications`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
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
                        "You do not have permission to view applications."
                    );
                }

                throw new Error(
                    data.message || "Unable to load applications."
                );
            }

            if (!Array.isArray(data)) {
                throw new Error("Unexpected response from the server.");
            }

            setApplications(data);
        } catch (err) {
            console.error("Applications loading error:", err);
            setError(
                err.message ||
                    "Unable to load applications. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const filtered = applications.filter((application) =>
        [
            application.student_name,
            application.student_email,
            application.job_title,
            application.company_name,
            application.status,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <Link to="/admin" className="admin-logo">
                    Job<span>Hub</span>
                </Link>

                <nav className="admin-nav">
                    <Link to="/admin">🏠 Dashboard</Link>

                    <Link to="/admin/job-approvals">
                        ✅ Job Approvals
                    </Link>

                    <Link to="/admin/shortlist-approvals">
                        ⭐ Shortlist Approvals
                    </Link>

                    <Link to="/admin/students">
                        🎓 Students
                    </Link>

                    <Link to="/admin/companies">
                        🏢 Companies
                    </Link>

                    <Link
                        to="/admin/applications"
                        className="active"
                    >
                        📄 Applications
                    </Link>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>
                            Student <span>Applications</span> 📄
                        </h1>

                        <p>
                            View applications submitted through JobHub.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-btn"
                        onClick={loadApplications}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "↻ Refresh"}
                    </button>
                </header>

                <section className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h2>All Applications</h2>

                            <p>
                                {applications.length} application
                                {applications.length === 1 ? "" : "s"} loaded
                            </p>
                        </div>

                        <input
                            className="admin-search"
                            type="search"
                            placeholder="Search applications..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            aria-label="Search applications"
                        />
                    </div>

                    {error && (
                        <div className="admin-error" role="alert">
                            <p>{error}</p>

                            <button
                                type="button"
                                className="admin-btn"
                                onClick={loadApplications}
                                disabled={loading}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <p>Loading applications...</p>
                    ) : error ? null : filtered.length === 0 ? (
                        <div className="admin-empty">
                            <span>📄</span>
                            <h3>No applications found</h3>
                            <p>
                                {applications.length === 0
                                    ? "Applications will appear here when students apply for jobs."
                                    : "Try changing your search."}
                            </p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Job</th>
                                        <th>Company</th>
                                        <th>Applied</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filtered.map((application) => (
                                        <tr
                                            key={application.id}
                                        >
                                            <td>
                                                <strong>
                                                    {application.student_name ||
                                                        "Unknown student"}
                                                </strong>

                                                <small>
                                                    {application.student_email ||
                                                        "—"}
                                                </small>
                                            </td>

                                            <td>
                                                {application.job_title || "—"}
                                            </td>

                                            <td>
                                                {application.company_name || "—"}
                                            </td>

                                            <td>
                                                {application.applied_at
                                                    ? new Date(
                                                          application.applied_at
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-badge ${String(
                                                        application.status || ""
                                                    ).toLowerCase()}`}
                                                >
                                                    {application.status ||
                                                        "Unknown"}
                                                </span>
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
