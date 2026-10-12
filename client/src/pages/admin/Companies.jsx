
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API = "http://localhost:5000";

export default function Companies() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const loadCompanies = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Please sign in first.");

            const response = await fetch(`${API}/api/admin/companies`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to load companies.");
            }

            setCompanies(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Unable to load companies.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const filtered = companies.filter((company) =>
        [company.full_name, company.email, company.id]
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
                    <Link to="/admin/companies" className="active">
                        🏢 Companies
                    </Link>
                    <Link to="/admin/applications">📄 Applications</Link>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Registered <span>Companies</span> 🏢</h1>
                        <p>View companies that have joined JobHub.</p>
                    </div>
                    <button className="admin-btn" onClick={loadCompanies}>
                        ↻ Refresh
                    </button>
                </header>

                <section className="admin-stats">
                    <div className="admin-stat-card companies">
                        <div className="admin-stat-top">
                            <div className="admin-stat-icon">🏢</div>
                            <div>
                                <h3>Total Companies</h3>
                                <p className="stat-value">
                                    {loading ? "..." : companies.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h2>Company Directory</h2>
                            <p>Search registered company accounts.</p>
                        </div>
                        <input
                            className="admin-search"
                            type="search"
                            placeholder="Search companies..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {error && <div className="admin-error">{error}</div>}

                    {loading ? (
                        <p>Loading companies...</p>
                    ) : filtered.length === 0 ? (
                        <div className="admin-empty">
                            <span>🏢</span>
                            <h3>No companies found</h3>
                            <p>
                                Registered company accounts will appear here
                                with their registered contact details and
                                join dates.
                            </p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Email address</th>
                                        <th>Account ID</th>
                                        <th>Joined JobHub</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((company) => (
                                        <tr key={company.id}>
                                            <td>
                                                <div className="admin-company-cell">
                                                    <span className="admin-company-logo">
                                                        🏢
                                                    </span>
                                                    <strong>
                                                        {company.full_name}
                                                    </strong>
                                                </div>
                                            </td>
                                            <td>{company.email}</td>
                                            <td>#{company.id}</td>
                                            <td>
                                                {company.created_at
                                                    ? new Date(
                                                          company.created_at
                                                      ).toLocaleDateString()
                                                    : "—"}
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
