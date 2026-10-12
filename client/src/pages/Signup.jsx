
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const API = "https://jobhub-4u5b.onrender.com";

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "Student",
        adminCode: ""
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                `${API}/api/auth/signup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        email: form.email.trim().toLowerCase(),
                        password: form.password,
                        role: form.role,
                        ...(form.role === "Admin"
                            ? { adminCode: form.adminCode.trim() }
                            : {})
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    `Registration failed (${response.status}).`
                );
            }

            navigate("/", {
                state: {
                    message:
                        data.message ||
                        "Account created successfully. Please sign in."
                }
            });
        } catch (error) {
            console.error("Signup error:", error);

            if (error instanceof TypeError) {
                setMessage(
                    "Unable to connect to JobHub. Please check your internet connection or try again later."
                );
            } else {
                setMessage(error.message || "Unable to register.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Create your account</h1>

                <p>
                    Join JobHub and start your career journey.
                </p>

                {message && (
                    <div className="auth-message" role="alert">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="name">Full name</label>
                    <input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        required
                    />

                    <label htmlFor="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        minLength={8}
                        autoComplete="new-password"
                        required
                    />

                    <label htmlFor="role">Register as</label>
                    <select
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="Student">Student</option>
                        <option value="Company">Company</option>
                        <option value="Admin">Admin</option>
                    </select>

                    {form.role === "Admin" && (
                        <>
                            <label htmlFor="adminCode">
                                Admin registration code
                            </label>
                            <input
                                id="adminCode"
                                type="password"
                                name="adminCode"
                                value={form.adminCode}
                                onChange={handleChange}
                                placeholder="Enter admin registration code"
                                autoComplete="off"
                                required
                            />
                        </>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading
                            ? "Creating account..."
                            : "Create Account →"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
