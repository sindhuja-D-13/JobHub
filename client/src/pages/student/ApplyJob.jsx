import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = "http://localhost:5000";

function ApplyJob() {
    const navigate = useNavigate();
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadJob() {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please sign in to apply for a job.");
                setLoading(false);
                return;
            }

            try {
                const storedUser = JSON.parse(
                    localStorage.getItem("user") || "null"
                );
                const response = await fetch(`${API}/api/jobs`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load the job.");
                }

                if (!Array.isArray(data)) {
                    throw new Error("The server returned an unexpected jobs response.");
                }

                const selectedJob = data.find(
                    (item) => String(item.id) === String(jobId)
                );

                if (!selectedJob) {
                    throw new Error("This job is unavailable or not approved.");
                }

                if (!cancelled) {
                    setJob(selectedJob);
                    setUser(storedUser);
                }
            } catch (loadError) {
                if (!cancelled) {
                    console.error("Apply page loading error:", loadError);
                    setError(loadError.message || "Unable to load this job.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadJob();

        return () => {
            cancelled = true;
        };
    }, [jobId]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
            setError("Your session has expired. Please sign in again.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(
                `${API}/api/student/applications/${jobId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to submit your application.");
            }

            navigate("/student/applications", {
                replace: true,
                state: { message: data.message }
            });
        } catch (submitError) {
            console.error("Application submission error:", submitError);
            setError(
                submitError.message || "Unable to submit your application."
            );
        } finally {
            setSubmitting(false);
        }
    }

    function signOut() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    }

    if (loading) {
        return <p className="profile-loading">Loading job...</p>;
    }

    return (
        <div className="dashboard-page">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    Job<span>Hub</span>
                </div>

                <nav>
                    <button onClick={() => navigate("/student/dashboard")}>
                        🏠 Dashboard
                    </button>
                    <button onClick={() => navigate("/student/jobs")}>
                        💼 Browse Jobs
                    </button>
                    <button
                        className="active"
                        onClick={() => navigate(`/student/jobs/${jobId}`)}
                    >
                        📄 Apply
                    </button>
                    <button onClick={() => navigate("/student/applications")}>
                        📋 My Applications
                    </button>
                </nav>

                <button className="logout" onClick={signOut}>
                    ↪ Sign out
                </button>
            </aside>

            <main className="dashboard-main">
                <div className="form-container">
                    <div className="page-title">
                        <h1>Apply for {job?.title || "Job"}</h1>
                        <p>
                            {job?.company_name || "Company"}
                            {job?.location ? ` · ${job.location}` : ""}
                        </p>
                    </div>

                    {error && (
                        <div className="job-submit-message error" role="alert">
                            {error}
                        </div>
                    )}

                    {job && (
                        <form
                            className="application-form"
                            onSubmit={handleSubmit}
                        >
                            <h2>Applicant Information</h2>
                            <p>
                                Your application will be submitted using your
                                signed-in JobHub account.
                            </p>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        value={
                                            user?.name ||
                                            user?.full_name ||
                                            "Name unavailable"
                                        }
                                        readOnly
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        value={user?.email || "Email unavailable"}
                                        readOnly
                                    />
                                </div>
                                <div className="form-group full">
                                    <label>Position</label>
                                    <input value={job.title} readOnly />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => navigate(`/student/jobs/${jobId}`)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "Submitting..."
                                        : "Submit Application"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}

export default ApplyJob;
