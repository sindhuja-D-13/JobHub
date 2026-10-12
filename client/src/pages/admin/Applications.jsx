
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API = "http://localhost:5000";

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
            if (!token) throw new Error("Please sign in first.");

            const response = await fetch(
                `${API}/api/admin/applications`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load applications."
                );
            }

            setApplications(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Unable to load applications.");
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
            application.status
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
                    <Link to="/admin/job-approvals">✅ Job Approvals</Link>
                    <Link to="/admin/shortlist-approvals">
                        ⭐ Shortlist Approvals
                    </Link>
                    <Link to="/admin/students">🎓 Students</Link>
                    <Link to="/admin/companies">🏢 Companies</Link>
                    <Link to="/admin/applications" className="active">
                        📄 Applications
                    </Link>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Student <span>Applications</span> 📄</h1>
                        <p>View applications submitted through JobHub.</p>
                    </div>
                    <button className="admin-btn" onClick={loadApplications}>
                        ↻ Refresh
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
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {error && <div className="admin-error">{error}</div>}

                    {loading ? (
                        <p>Loading applications...</p>
                    ) : filtered.length === 0 ? (
                        <div className="admin-empty">
                            <span>📄</span>
                            <h3>No applications found</h3>
                            <p>
                                Applications will appear here when the
                                admin applications API is connected.
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
                                        <tr key={application.id}>
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
                                            <td>{application.job_title || "—"}</td>
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
                                                    {application.status || "Unknown"}
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
