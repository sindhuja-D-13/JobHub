import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
).replace(/\/+$/, "");

export default function ShortlistApprovals() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please sign in first.");
            }

            const response = await fetch(
                `${API}/api/admin/shortlist-approvals`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
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
                        "You do not have permission to view shortlist approvals."
                    );
                }

                throw new Error(
                    data.message || "Unable to load shortlist approvals."
                );
            }

            if (!Array.isArray(data)) {
                throw new Error("The server returned an unexpected response.");
            }

            setApplications(data);
        } catch (loadError) {
            console.error("Admin shortlist loading error:", loadError);
            setError(
                loadError.message || "Unable to load shortlist approvals."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    async function recordDecision(applicationId, approval) {
        setUpdatingId(applicationId);
        setError("");
        setMessage("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Please sign in first.");
            }

            const response = await fetch(
                `${API}/api/admin/applications/${applicationId}/approval`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ approval }),
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
                        "You do not have permission to make this decision."
                    );
                }

                throw new Error(
                    data.message || "Unable to save the shortlist decision."
                );
            }

            setMessage(data.message || "Shortlist decision saved.");
            await loadApplications();
        } catch (saveError) {
            console.error("Admin shortlist decision error:", saveError);
            setError(saveError.message || "Unable to save the decision.");
        } finally {
            setUpdatingId(null);
        }
    }

    const pendingCount = applications.filter(
        (application) =>
            application.status === "shortlisted" &&
            application.admin_approval === "pending"
    ).length;

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <Link to="/admin" className="admin-logo">
                    Job<span>Hub</span>
                </Link>

                <nav className="admin-nav">
                    <Link to="/admin">🏠 Dashboard</Link>
                    <Link to="/admin/job-approvals">✅ Job Approvals</Link>
                    <Link to="/admin/shortlist-approvals" className="active">
                        ⭐ Shortlist Approvals
                    </Link>
                    <Link to="/admin/students">🎓 Students</Link>
                    <Link to="/admin/companies">🏢 Companies</Link>
                    <Link to="/admin/applications">📄 Applications</Link>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>
                            Shortlist <span>Approvals</span> ⭐
                        </h1>
                        <p>
                            Review candidates shortlisted by companies and
                            record a decision.
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

                {message && (
                    <div className="admin-success" role="status">
                        {message}
                    </div>
                )}

                <section className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h2>Shortlisted Candidates</h2>
                            <p>
                                {pendingCount} awaiting review ·{" "}
                                {applications.length} total records
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <p>Loading shortlist approvals...</p>
                    ) : error ? null : applications.length === 0 ? (
                        <div className="admin-empty">
                            <span>⭐</span>
                            <h3>No candidates to review</h3>
                            <p>
                                Company-shortlisted candidates will appear
                                here for an admin decision.
                            </p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table shortlist-table">
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Applied job</th>
                                        <th>Company</th>
                                        <th>Shortlist status</th>
                                        <th>Admin decision</th>
                                        <th>Decision</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {applications.map((application) => {
                                        const pending =
                                            application.status ===
                                                "shortlisted" &&
                                            application.admin_approval ===
                                                "pending";

                                        return (
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
                                                <td>
                                                    {application.job_title || "—"}
                                                </td>
                                                <td>
                                                    {application.company_name || "—"}
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
                                                <td>
                                                    <span
                                                        className={`admin-badge ${String(
                                                            application.admin_approval ||
                                                                ""
                                                        ).toLowerCase()}`}
                                                    >
                                                        {application.admin_approval ||
                                                            "Not set"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {pending ? (
                                                        <div className="shortlist-actions">
                                                            <button
                                                                type="button"
                                                                className="admin-btn admin-btn-danger"
                                                                disabled={
                                                                    updatingId !== null
                                                                }
                                                                onClick={() =>
                                                                    recordDecision(
                                                                        application.id,
                                                                        "rejected"
                                                                    )
                                                                }
                                                            >
                                                                {updatingId ===
                                                                application.id
                                                                    ? "Processing..."
                                                                    : "Reject"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="admin-btn"
                                                                disabled={
                                                                    updatingId !== null
                                                                }
                                                                onClick={() =>
                                                                    recordDecision(
                                                                        application.id,
                                                                        "approved"
                                                                    )
                                                                }
                                                            >
                                                                {updatingId ===
                                                                application.id
                                                                    ? "Processing..."
                                                                    : "Approve"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <small>Decision recorded</small>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
