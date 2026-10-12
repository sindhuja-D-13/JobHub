
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchJobs() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Please sign in to view approved jobs.");
        }

        const response = await fetch("http://localhost:5000/api/jobs", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Could not load approved jobs.");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("The server returned an unexpected jobs response.");
        }
        if (!cancelled) {
          setJobs(data);
          setError("");
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.error("Approved jobs loading error:", fetchError);
          setError(fetchError.message || "Unable to load approved jobs.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p>Loading jobs...</p>;

  return (
    <div className="approved-jobs-page">
      <header className="approved-jobs-header">
        <button
          className="approved-jobs-back"
          onClick={() => navigate("/student/dashboard")}
        >
          ← Dashboard
        </button>
        <span className="approved-jobs-brand">JobHub</span>
      </header>

      <main className="approved-jobs-content">
        <div className="approved-jobs-heading">
          <span>CAREER OPPORTUNITIES</span>
          <h1>Find your next role</h1>
          <p>Explore jobs approved by the JobHub team.</p>
        </div>

        {error ? (
          <div className="approved-jobs-empty" role="alert">
            <h2>Unable to load jobs</h2>
            <p>{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="approved-jobs-empty">
            <h2>No approved jobs yet</h2>
            <p>Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="approved-jobs-list">
            {jobs.map((job) => (
              <article className="approved-job-card" key={job.id}>
                <div className="approved-job-company-icon">
                  {(job.company_name || "C").charAt(0).toUpperCase()}
                </div>
                <div className="approved-job-info">
                  <h2>{job.title}</h2>
                  <p className="approved-job-company">{job.company_name}</p>
                  <div className="approved-job-meta">
                    <span>{job.location || "Location not specified"}</span>
                    <span>{job.job_type || "Job type not specified"}</span>
                    {job.salary && <span>{job.salary}</span>}
                  </div>
                  <p className="approved-job-description">{job.description}</p>
                  {job.skills && (
                    <p className="approved-job-skills">
                      <strong>Skills:</strong> {job.skills}
                    </p>
                  )}
                </div>
                <button
                  className="approved-job-apply"
                  type="button"
                  onClick={() => navigate(`/student/jobs/${job.id}`)}
                >
                  View job
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Jobs;