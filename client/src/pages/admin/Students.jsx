import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const loadStudents = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Please sign in first.");

            const response = await fetch(`${API}/api/admin/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to load students.");
            }

            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Unable to load students.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const filtered = students.filter((student) =>
        [student.full_name, student.email, student.id]
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
                    <Link to="/admin/students" className="active">
                        🎓 Students
                    </Link>
                    <Link to="/admin/companies">🏢 Companies</Link>
                    <Link to="/admin/applications">📄 Applications</Link>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Registered <span>Students</span> 🎓</h1>
                        <p>View student accounts registered on JobHub.</p>
                    </div>
                    <button className="admin-btn" onClick={loadStudents}>
                        ↻ Refresh
                    </button>
                </header>

                <section className="admin-stats">
                    <div className="admin-stat-card students">
                        <div className="admin-stat-top">
                            <div className="admin-stat-icon">🎓</div>
                            <div>
                                <h3>Total Students</h3>
                                <p className="stat-value">
                                    {loading ? "..." : students.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h2>Student Directory</h2>
                            <p>Search student names and email addresses.</p>
                        </div>
                        <input
                            className="admin-search"
                            type="search"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {error && <div className="admin-error">{error}</div>}

                    {loading ? (
                        <p>Loading students...</p>
                    ) : filtered.length === 0 ? (
                        <div className="admin-empty">
                            <span>🎓</span>
                            <h3>No students found</h3>
                            <p>
                                Registered student accounts will appear here
                                with their account creation dates.
                            </p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Email address</th>
                                        <th>Account ID</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((student) => (
                                        <tr key={student.id}>
                                            <td>
                                                <div className="admin-company-cell">
                                                    <span className="admin-user-avatar">
                                                        🎓
                                                    </span>
                                                    <strong>
                                                        {student.full_name}
                                                    </strong>
                                                </div>
                                            </td>
                                            <td>{student.email}</td>
                                            <td>#{student.id}</td>
                                            <td>
                                                {student.created_at
                                                    ? new Date(
                                                          student.created_at
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
