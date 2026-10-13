import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./StudentProfile.css";

const API = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function StudentProfile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [nameInput, setNameInput] = useState("");
    const [editingName, setEditingName] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        try {
            const savedUser = JSON.parse(
                localStorage.getItem("user") || "null"
            );

            if (!token || !savedUser) {
                navigate("/", {
                    replace: true,
                    state: {
                        message: "Please sign in to view your profile."
                    }
                });
                return;
            }

            setUser(savedUser);
            setNameInput(savedUser.name || savedUser.full_name || "");
        } catch {
            localStorage.removeItem("user");
            navigate("/", { replace: true });
        }
    }, [navigate]);

    async function handleSaveName(event) {
        event.preventDefault();
        setMessage("");
        setMessageType("");

        const cleanName = nameInput.trim();
        if (!cleanName) {
            setMessage("Please enter your name.");
            setMessageType("error");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/", {
                replace: true,
                state: { message: "Please sign in to update your profile." }
            });
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(`${API}/api/account/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: cleanName })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to update your name.");
            }

            setUser(data.user);
            setNameInput(data.user.name);
            localStorage.setItem("user", JSON.stringify(data.user));
            setEditingName(false);
            setMessage(data.message || "Profile name updated successfully.");
            setMessageType("success");
        } catch (error) {
            console.error("Profile update error:", error);
            setMessage(error.message || "Unable to update your name.");
            setMessageType("error");
        } finally {
            setSaving(false);
        }
    }

    function handleSignOut() {
        if (!window.confirm("Are you sure you want to sign out?")) {
            return;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
    }

    if (!user) {
        return <div className="profile-loading">Loading profile...</div>;
    }

    const name = user.name || user.full_name || "JobHub User";
    const email = user.email || "Email unavailable";
    const role = String(user.role || "student").toLowerCase();

    return (
        <div className="profile-page">
            <header className="profile-header">
                <Link to="/student/dashboard" className="profile-logo">
                    Job<span>Hub</span>
                </Link>

                <Link
                    to={
                        role === "admin"
                            ? "/admin/dashboard"
                            : role === "company"
                            ? "/company/dashboard"
                            : "/student/dashboard"
                    }
                    className="profile-back"
                >
                    ← Dashboard
                </Link>
            </header>

            <main className="profile-container">
                <section className="profile-banner">
                    <div className="profile-banner-decoration" />
                    <div className="profile-avatar">
                        {name.charAt(0).toUpperCase()}
                    </div>

                    <h1>{name}</h1>
                    <p>{email}</p>

                    <span className="profile-role">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                </section>

                <section className="profile-details">
                    <div className="profile-section-heading">
                        <div>
                            <h2>Personal Information</h2>
                            <p>Your JobHub account details</p>
                        </div>
                        <span className="profile-heading-icon">👤</span>
                    </div>

                    {message && (
                        <div
                            className={`profile-message ${messageType}`}
                            role={messageType === "error" ? "alert" : "status"}
                        >
                            {message}
                        </div>
                    )}

                    {editingName ? (
                        <form className="profile-name-form" onSubmit={handleSaveName}>
                            <label htmlFor="profile-name">Full Name</label>
                            <input
                                id="profile-name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                maxLength={100}
                                value={nameInput}
                                onChange={(event) => setNameInput(event.target.value)}
                                required
                            />
                            <div className="profile-name-actions">
                                <button type="submit" disabled={saving}>
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                                <button
                                    type="button"
                                    className="profile-cancel"
                                    disabled={saving}
                                    onClick={() => {
                                        setNameInput(name);
                                        setEditingName(false);
                                        setMessage("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-info-row">
                            <div className="profile-info-icon">👤</div>
                            <div>
                                <span>Full Name</span>
                                <strong>{name}</strong>
                            </div>
                            <button
                                type="button"
                                className="profile-edit-name"
                                onClick={() => {
                                    setNameInput(name);
                                    setEditingName(true);
                                    setMessage("");
                                }}
                            >
                                Change name
                            </button>
                        </div>
                    )}

                    <div className="profile-info-row">
                        <div className="profile-info-icon">✉️</div>
                        <div>
                            <span>Email Address</span>
                            <strong>{email}</strong>
                        </div>
                    </div>

                    <div className="profile-info-row">
                        <div className="profile-info-icon">🛡️</div>
                        <div>
                            <span>Account Type</span>
                            <strong>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </strong>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="profile-signout"
                        onClick={handleSignOut}
                    >
                        ↪ Sign Out
                    </button>
                </section>
            </main>
        </div>
    );
}
