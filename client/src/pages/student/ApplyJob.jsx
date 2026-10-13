
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

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
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const contentType =
                    response.headers.get("content-type") || "";

                if (!contentType.includes("application/json")) {
                    throw new Error(
                        "The server returned an unexpected response. Please check the backend URL and deployment."
                    );
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load the job."
                    );
                }

                if (!Array.isArray(data)) {
                    throw new Error(
                        "The server returned an unexpected jobs response."
                    );
                }

                const selectedJob = data.find(
                    (item) => String(item.id) === String(jobId)
                );

                if (!selectedJob) {
                    throw new Error(
                        "This job is unavailable or not approved."
                    );
                }

                if (!cancelled) {
                    setJob(selectedJob);
                    setUser(storedUser);
                }
            } catch (loadError) {
                if (!cancelled) {
                    console.error("Apply page loading error:", loadError);
                    setError(
                        loadError.message || "Unable to load this job."
                    );
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

        if (!jobId) {
            setError("Invalid job ID. Please return to the jobs page.");
            return;
        }

        setSubmitting(true);

        try {
            // This matches the application route in server.js.
            const response = await fetch(
                `${API}/api/jobs/${encodeURIComponent(jobId)}/apply`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({})
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            let data = {};

            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const responseText = await response.text();

                console.error(
                    "Unexpected application response:",
                    response.status,
                    responseText.slice(0, 300)
                );

                throw new Error(
                    `The server returned a non-JSON response (HTTP ${response.status}). Please check the backend deployment and API URL.`
                );
            }

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Your session has expired. Please sign in again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        data.message ||
                        "You are not authorized to apply for this job."
                    );
                }

                throw new Error(
                    data.message || "Unable to submit your application."
                );
            }

            navigate("/student/applications", {
                replace: true,
                state: {
                    message:
                        data.message || "Application submitted successfully."
                }
            });
        } catch (submitError) {
            console.error("Application submission error:", submitError);

            setError(
                submitError.message ||
                "Unable to submit your application. Please try again."
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
                    <button
                        type="button"
                        onClick={() => navigate("/student/dashboard")}
                    >
                        🏠 Dashboard
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/student/jobs")}
                    >
                        💼 Browse Jobs
                    </button>

                    <button
                        type="button"
                        className="active"
                        onClick={() =>
                            navigate(`/student/jobs/${jobId}`)
                        }
                    >
                        📄 Apply
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/student/applications")
                        }
                    >
                        📋 My Applications
                    </button>
                </nav>

                <button
                    type="button"
                    className="logout"
                    onClick={signOut}
                >
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
                        <div
                            className="job-submit-message error"
                            role="alert"
                        >
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
                                Your application will be submitted using
                                your signed-in JobHub account.
                            </p>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="applicant-name">
                                        Full Name
                                    </label>

                                    <input
                                        id="applicant-name"
                                        value={
                                            user?.name ||
                                            user?.full_name ||
                                            "Name unavailable"
                                        }
                                        readOnly
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="applicant-email">
                                        Email Address
                                    </label>

                                    <input
                                        id="applicant-email"
                                        value={
                                            user?.email ||
                                            "Email unavailable"
                                        }
                                        readOnly
                                    />
                                </div>

                                <div className="form-group full">
                                    <label htmlFor="application-position">
                                        Position
                                    </label>

                                    <input
                                        id="application-position"
                                        value={job.title}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() =>
                                        navigate(`/student/jobs/${jobId}`)
                                    }
                                    disabled={submitting}
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
