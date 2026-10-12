
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Auth.css";

const API = "http://localhost:5000";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState(
        location.state?.message || ""
    );
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail || !password) {
            setMessage("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: cleanEmail,
                    password
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || `Login failed (${response.status}).`
                );
            }

            if (!data.token || !data.user || !data.user.role) {
                throw new Error(
                    "The server did not return a valid login session."
                );
            }

            const role = String(data.user.role).toLowerCase();

            const routes = {
                student: "/student/dashboard",
                company: "/company/dashboard",
                admin: "/admin"
            };

            const dashboard = routes[role];

            if (!dashboard) {
                throw new Error(
                    "Your account has an unrecognized role."
                );
            }

            // Save the session in localStorage so the dashboard
            // can read the same token after navigation or refresh.
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Remove any older sessionStorage copies.
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");

            // Navigate to the dashboard for the account role.
            navigate(dashboard, { replace: true });

        } catch (error) {
            console.error("Login error:", error);

            if (
                error instanceof TypeError ||
                error.message === "Failed to fetch"
            ) {
                setMessage(
                    "Cannot connect to JobHub server. Make sure your backend is running on port 5000."
                );
            } else {
                setMessage(
                    error.message || "Unable to sign in. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Welcome back!</h1>

                <p>
                    Sign in to continue your career journey.
                </p>

                {message && (
                    <div className="auth-message" role="alert">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">
                        Email address
                    </label>

                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="password">
                        Password
                    </label>

                    <div className="password-field">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                        />

                        <button
                            type="button"
                            className="show-password"
                            onClick={() =>
                                setShowPassword((previous) => !previous)
                            }
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading
                            ? "Signing in..."
                            : "Sign in to JobHub →"}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
