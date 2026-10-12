import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

function Applications() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadApplications() {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Please sign in to view applications.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API}/api/company/applications`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load applications."
                    );
                }
                if (!Array.isArray(data)) {
                    throw new Error("The server returned an unexpected response.");
                }

                if (!cancelled) {
                    setApplications(data);
                    setError("");
                }
            } catch (loadError) {
                if (!cancelled) {
                    console.error("Company applications error:", loadError);
                    setError(loadError.message || "Unable to load applications.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadApplications();
        return () => {
            cancelled = true;
        };
    }, []);

    async function shortlistCandidate(applicationId) {
        setUpdatingId(applicationId);
        setError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Please sign in first.");

            const response = await fetch(
                `${API}/api/company/applications/${applicationId}/shortlist`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: "Bearer " + token,
                        Accept: "application/json"
                    }
                }
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to shortlist candidate.");
            }

            setApplications((current) =>
                current.map((application) =>
                    application.id === applicationId
                        ? {
                              ...application,
                              status: "shortlisted",
                              admin_approval: "pending"
                          }
                        : application
                )
            );
        } catch (updateError) {
            console.error("Company shortlist error:", updateError);
            setError(updateError.message || "Unable to shortlist candidate.");
        } finally {
            setUpdatingId(null);
        }
    }

    function handleLogout() {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    }

    return (
        <div className="dashboard-page">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    Job<span>Hub</span>
                </div>

                <nav>
                    <button onClick={() => navigate("/company/dashboard")}>
                        🏠 Dashboard
                    </button>
                    <button onClick={() => navigate("/company/post-job")}>
                        ➕ Post Job
                    </button>
                    <button className="active">
                        📄 Applications
                    </button>
                    <button onClick={() => navigate("/company/jobs")}>
                        💼 My Jobs
                    </button>
                </nav>

                <button className="logout" onClick={handleLogout}>
                    ↪ Logout
                </button>
            </aside>

            <main className="dashboard-main">
                <div className="page-title">
                    <h1>Job Applications</h1>
                    <p>Review students who applied to your approved jobs.</p>
                </div>

                {error && <p role="alert">{error}</p>}
                {loading ? (
                    <p>Loading applications...</p>
                ) : error ? null : applications.length === 0 ? (
                    <p>No student applications have been submitted yet.</p>
                ) : (
                    <div className="application-review-list">
                        {applications.map((application) => (
                            <article
                                className="candidate-card"
                                key={application.id}
                            >
                                <div className="candidate-avatar">
                                    {(application.student_name || "S")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="candidate-details">
                                    <h2>{application.student_name || "Student"}</h2>
                                    <p>{application.student_email}</p>
                                    <p>
                                        Applied for:{" "}
                                        <strong>
                                            {application.job_title || "Job"}
                                        </strong>
                                    </p>
                                    <p>
                                        Applied on:{" "}
                                        {application.applied_at
                                            ? new Date(
                                                  application.applied_at
                                              ).toLocaleDateString()
                                            : "Date unavailable"}
                                    </p>
                                </div>

                                <div className="company-application-actions">
                                    <span className="status applied">
                                        {application.status || "applied"}
                                    </span>
                                    {application.status === "applied" && (
                                        <button
                                            type="button"
                                            className="company-shortlist-btn"
                                            disabled={updatingId !== null}
                                            onClick={() =>
                                                shortlistCandidate(
                                                    application.id
                                                )
                                            }
                                        >
                                            {updatingId === application.id
                                                ? "Submitting..."
                                                : "Shortlist"}
                                        </button>
                                    )}
                                    {application.status === "shortlisted" &&
                                        application.admin_approval ===
                                            "pending" && (
                                            <small>
                                                Awaiting admin approval
                                            </small>
                                        )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Applications;
