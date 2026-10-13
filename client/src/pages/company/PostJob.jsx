import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PostJob.css";

const API = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function PostJob() {
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);
    const [job, setJob] = useState({
        title: "",
        description: "",
        skills: "",
        salary: "",
        location: "",
        type: ""
    });

    const handleChange = (e) => {
        setJob({
            ...job,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("Please sign in again before posting a job.");
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/api/company/jobs`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: job.title,
                    description: job.description,
                    skills: job.skills,
                    salary: job.salary,
                    location: job.location,
                    job_type: job.type
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to post this job.");
            }

            setMessage(data.message || "Job submitted for admin approval.");
            setMessageType("success");
            setJob({
                title: "",
                description: "",
                skills: "",
                salary: "",
                location: "",
                type: ""
            });
        } catch (error) {
            console.error("Post job error:", error);
            setMessage(error.message || "Unable to post this job.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

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

                    <button className="active">
                        ➕ Post Job
                    </button>

                    <button onClick={() => navigate("/company/applications")}>
                        📄 Applications
                    </button>

                    <button onClick={() => navigate("/company/jobs")}>
                        💼 My Jobs
                    </button>
                </nav>

                <button
                    className="logout"
                    onClick={() => navigate("/")}
                >
                    ↪ Logout
                </button>
            </aside>

            <main className="dashboard-main">
                <div className="form-container">
                    <div className="page-title">
                        <h1>Post a New Job</h1>
                        <p>
                            Your job will be sent to Admin for approval.
                        </p>
                    </div>

                    <form
                        className="application-form"
                        onSubmit={handleSubmit}
                    >
                        {message && (
                            <div
                                className={`job-submit-message ${messageType}`}
                                role={messageType === "error" ? "alert" : "status"}
                            >
                                {message}
                            </div>
                        )}

                        <h2>Job Information</h2>

                        <div className="form-grid">
                            <div className="form-group full">
                                <label>Job Title *</label>
                                <input
                                    name="title"
                                    value={job.title}
                                    onChange={handleChange}
                                    placeholder="Example: Software Developer"
                                    required
                                />
                            </div>

                            <div className="form-group full">
                                <label>Job Description *</label>
                                <textarea
                                    name="description"
                                    value={job.description}
                                    onChange={handleChange}
                                    placeholder="Describe the job responsibilities..."
                                    rows="5"
                                    required
                                />
                            </div>

                            <div className="form-group full">
                                <label>Required Skills *</label>
                                <input
                                    name="skills"
                                    value={job.skills}
                                    onChange={handleChange}
                                    placeholder="Java, Python, SQL, React"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Salary *</label>
                                <input
                                    name="salary"
                                    value={job.salary}
                                    onChange={handleChange}
                                    placeholder="₹5 - ₹8 LPA"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Location *</label>
                                <input
                                    name="location"
                                    value={job.location}
                                    onChange={handleChange}
                                    placeholder="Hyderabad"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Job Type *</label>
                                <select
                                    name="type"
                                    value={job.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select type</option>
                                    <option>Full Time</option>
                                    <option>Part Time</option>
                                    <option>Internship</option>
                                    <option>Remote</option>
                                </select>
                            </div>
                        </div>

                        <div className="approval-note">
                            <strong>Admin Verification</strong>
                            <p>
                                After submitting this job, it will remain
                                pending until an administrator verifies
                                and approves it.
                            </p>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => navigate("/company/dashboard")}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={loading}
                            >
                                {loading ? "Submitting..." : "Submit for Approval"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default PostJob;
