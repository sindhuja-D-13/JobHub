
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  await response.text();

  if (response.status === 404) {
    throw new Error(
      "API route not found. Check server.js and redeploy the backend."
    );
  }

  throw new Error(
    `The server returned an invalid response (HTTP ${response.status}).`
  );
}

function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please sign in to view applications.");
      }

      const response = await fetch(`${API}/api/company/applications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session expired. Please sign in again.");
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view these applications."
          );
        }

        throw new Error(data?.message || "Unable to load applications.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from the server.");
      }

      setApplications(data);
    } catch (err) {
      console.error("Company applications error:", err);
      setError(err.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function shortlistCandidate(applicationId) {
    if (
      applicationId == null ||
      !Number.isInteger(Number(applicationId)) ||
      Number(applicationId) <= 0
    ) {
      setError("Invalid application ID. Please refresh the applications.");
      return;
    }

    setUpdatingId(applicationId);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please sign in first.");
      }

      const response = await fetch(
        `${API}/api/company/applications/${encodeURIComponent(
          applicationId
        )}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: "shortlisted",
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session expired. Please sign in again.");
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to shortlist this candidate."
          );
        }

        throw new Error(
          data?.message || "Unable to shortlist candidate."
        );
      }

      setMessage(
        data?.message || "Candidate shortlisted successfully."
      );

      await loadApplications();
    } catch (err) {
      console.error("Company shortlist error:", err);
      setError(err.message || "Unable to shortlist candidate.");
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
          <button
            type="button"
            onClick={() => navigate("/company/dashboard")}
          >
            🏠 Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/company/post-job")}
          >
            ➕ Post Job
          </button>

          <button type="button" className="active">
            📄 Applications
          </button>

          <button
            type="button"
            onClick={() => navigate("/company/jobs")}
          >
            💼 My Jobs
          </button>
        </nav>

        <button
          type="button"
          className="logout"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="page-title">
          <h1>Job Applications</h1>
          <p>Review students who applied to your approved jobs.</p>
        </div>

        <div className="application-toolbar">
          <button
            type="button"
            onClick={loadApplications}
            disabled={loading || updatingId !== null}
          >
            {loading ? "Loading..." : "Refresh applications"}
          </button>
        </div>

        {error && (
          <div role="alert" className="application-error">
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div role="status" className="application-success">
            <p>{message}</p>
          </div>
        )}

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          !error && (
            <p>No student applications have been submitted yet.</p>
          )
        ) : (
          <div className="application-review-list">
            {applications.map((application) => {
              const applicationId = application.application_id;

              const status = String(
                application.status || "applied"
              ).toLowerCase();

              const adminApproval = String(
                application.admin_approval || ""
              ).toLowerCase();

              const isPendingApproval =
                status === "shortlisted" &&
                adminApproval === "pending";

              return (
                <article
                  className="candidate-card"
                  key={applicationId}
                >
                  <div className="candidate-avatar">
                    {(application.student_name || "S")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="candidate-details">
                    <h2>{application.student_name || "Student"}</h2>

                    <p>
                      {application.student_email || "Email unavailable"}
                    </p>

                    <p>
                      Applied for:{" "}
                      <strong>{application.job_title || "Job"}</strong>
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
                    <span className={`status ${status}`}>
                      {status}
                    </span>

                    {status === "applied" && (
                      <button
                        type="button"
                        className="company-shortlist-btn"
                        disabled={updatingId !== null}
                        onClick={() =>
                          shortlistCandidate(applicationId)
                        }
                      >
                        {updatingId === applicationId
                          ? "Submitting..."
                          : "Shortlist"}
                      </button>
                    )}

                    {isPendingApproval && (
                      <small>Awaiting admin approval</small>
                    )}

                    {status === "shortlisted" &&
                      adminApproval === "approved" && (
                        <small>Approved by admin</small>
                      )}

                    {status === "shortlisted" &&
                      adminApproval === "rejected" && (
                        <small>Rejected by admin</small>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Applications;
