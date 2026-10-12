
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MyApplications.css";

function MyApplications() {
  const navigate = useNavigate();
  const location = useLocation();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadApplications() {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please sign in to view your applications.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/student/applications",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            "The server returned HTML instead of JSON. Check your backend API route."
          );
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your applications."
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "The server returned an unexpected response."
          );
        }

        setApplications(data);
        setError("");
      } catch (err) {
        console.error("Applications loading error:", err);
        setError(
          err.message || "Unable to load your applications."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  function getStatusClass(status) {
    switch ((status || "").toLowerCase()) {
      case "shortlisted":
        return "shortlisted";
      case "rejected":
        return "rejected";
      case "selected":
        return "selected";
      default:
        return "applied";
    }
  }

  function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="applications-layout">
      {/* Sidebar */}
      <aside className="applications-sidebar">
        <button
          type="button"
          className="applications-logo"
          onClick={() => navigate("/student/dashboard")}
        >
          Job<span>Hub</span>
        </button>

        <p className="applications-nav-label">WORKSPACE</p>

        <nav className="applications-nav">
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/jobs")}
          >
            <span>⌕</span> Browse Jobs
          </button>

          <button type="button" className="active">
            <span>▤</span> My Applications
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/profile")}
          >
            <span>♙</span> My Profile
          </button>
        </nav>

        <button
          type="button"
          className="applications-logout"
          onClick={signOut}
        >
          ↪ Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="applications-main">
        <header className="applications-topbar">
          <p>
            Workspace / <strong>My Applications</strong>
          </p>

          <span className="applications-topbar-icon">▤</span>
        </header>

        <div className="applications-content">
          {location.state?.message && (
            <div className="applications-success" role="status">
              {location.state.message}
            </div>
          )}

          {/* Welcome section */}
          <section className="applications-welcome">
            <div>
              <span className="applications-eyebrow">
                YOUR CAREER JOURNEY
              </span>

              <h1>My Applications</h1>

              <p>
                Track the progress of the jobs you have applied for.
              </p>
            </div>
          </section>

          {/* Applications section */}
          <section className="applications-list-section">
            <div className="applications-section-heading">
              <div>
                <h2>Your applications</h2>
                <p>
                  View the current status of each submitted application.
                </p>
              </div>

              {!loading && !error && (
                <span className="applications-count">
                  {applications.length}{" "}
                  {applications.length === 1
                    ? "application"
                    : "applications"}
                </span>
              )}
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="applications-empty">
                <div className="applications-empty-icon">◷</div>
                <h3>Loading applications...</h3>
                <p>
                  Please wait while we retrieve your applications.
                </p>
              </div>
            ) : error ? (
              /* Error state */
              <div
                className="applications-empty"
                role="alert"
              >
                <div className="applications-empty-icon">!</div>
                <h3>Unable to load applications</h3>
                <p>{error}</p>

                <button
                  type="button"
                  className="applications-empty-button"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            ) : applications.length === 0 ? (
              /* Empty state without Browse Jobs button */
              <div className="applications-empty">
                <div className="applications-empty-icon">▤</div>
                <h3>No applications yet</h3>
                <p>
                  Your submitted job applications will appear here.
                </p>
              </div>
            ) : (
              /* Applications from the database */
              <div className="application-cards">
                {applications.map((application) => {
                  const companyName =
                    application.company_name ||
                    application.company ||
                    "Company";

                  const jobTitle =
                    application.job_title ||
                    application.job ||
                    "Job title unavailable";

                  return (
                    <article
                      className="application-card"
                      key={application.id}
                    >
                      <div className="application-company">
                        {companyName.charAt(0).toUpperCase()}
                      </div>

                      <div className="application-info">
                        <h2>{jobTitle}</h2>

                        <p>{companyName}</p>

                        <small>
                          Applied on{" "}
                          {formatDate(
                            application.applied_at ||
                              application.date
                          )}
                        </small>
                      </div>

                      <span
                        className={`application-status ${getStatusClass(
                          application.status
                        )}`}
                      >
                        {application.status || "Applied"}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="applications-footer">
            <span>© 2026 JobHub</span>
            <span>
              Build your future, one application at a time.
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default MyApplications;
