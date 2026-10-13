import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../App.css";
import "./JobDetails.css";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function JobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchJobDetails() {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please sign in to view job details.");
        setLoading(false);
        return;
      }

      try {
        // The backend returns only approved jobs.
        const response = await fetch(`${API}/api/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load jobs.");
        }

        const selectedJob = Array.isArray(data)
          ? data.find((item) => String(item.id) === String(id))
          : null;

        if (!cancelled) {
          if (selectedJob) {
            setJob(selectedJob);
          } else {
            setError("Job not found or it is not approved yet.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load job details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchJobDetails();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function applyForJob() {
    navigate(`/student/apply/${job.id}`);
  }

  if (loading) {
    return (
      <div className="job-details-page">
        <p className="job-details-message">Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-details-page">
        <div className="job-details-error">
          <h2>Unable to display job</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/student/jobs")}>
            Back to jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-page">
      <header className="job-details-header">
        <button
          className="job-back-button"
          onClick={() => navigate("/student/jobs")}
        >
          ← Back to jobs
        </button>

        <div className="job-details-brand">
          <span className="job-brand-icon">J</span>
          JobHub
        </div>
      </header>

      <main className="job-details-container">
        <section className="job-details-hero">
          <div className="job-company-avatar">
            {(job.company_name || "C").charAt(0).toUpperCase()}
          </div>

          <div className="job-hero-info">
            <span className="job-approved-label">Admin approved</span>
            <h1>{job.title}</h1>
            <p className="job-company-name">
              {job.company_name || "Company"}
            </p>

            <div className="job-details-meta">
              {job.location && <span>📍 {job.location}</span>}
              {job.job_type && <span>💼 {job.job_type}</span>}
              {job.salary && <span>💰 {job.salary}</span>}
            </div>
          </div>

          <button
            className="job-apply-button"
            onClick={applyForJob}
          >
            Apply now →
          </button>
        </section>

        <div className="job-details-grid">
          <section className="job-description-card">
            <h2>About this role</h2>
            <p className="job-description-text">
              {job.description || "No job description provided."}
            </p>

            <h2>Required skills</h2>
            {job.skills ? (
              <div className="job-details-skills">
                {job.skills
                  .split(",")
                  .map((skill) => skill.trim())
                  .filter(Boolean)
                  .map((skill, index) => (
                    <span key={`${skill}-${index}`}>{skill}</span>
                  ))}
              </div>
            ) : (
              <p>No specific skills listed.</p>
            )}

            <div className="job-apply-bottom">
              <h3>Interested in this opportunity?</h3>
              <p>Submit your application for the company to review.</p>
              <button onClick={applyForJob}>
                Apply for this job
              </button>
            </div>
          </section>

          <aside className="job-summary-card">
            <h2>Job summary</h2>

            <div className="job-summary-item">
              <span>Company</span>
              <strong>{job.company_name || "Not specified"}</strong>
            </div>

            <div className="job-summary-item">
              <span>Location</span>
              <strong>{job.location || "Not specified"}</strong>
            </div>

            <div className="job-summary-item">
              <span>Job type</span>
              <strong>{job.job_type || "Not specified"}</strong>
            </div>

            <div className="job-summary-item">
              <span>Salary</span>
              <strong>{job.salary || "Not specified"}</strong>
            </div>

            <div className="job-summary-item">
              <span>Posted</span>
              <strong>
                {job.created_at
                  ? new Date(job.created_at).toLocaleDateString()
                  : "Not specified"}
              </strong>
            </div>

            <div className="job-summary-status">
              <span>✓</span> Approved by JobHub Admin
            </div>
          </aside>
        </div>
      </main>

      <footer className="job-details-footer">
        © 2026 JobHub — Build your future, one application at a time.
      </footer>
    </div>
  );
}

export default JobDetails;
