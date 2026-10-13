const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Check required configuration
if (!process.env.JWT_SECRET) {
    console.error("ERROR: JWT_SECRET is missing from environment variables.");
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token is required."
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                message: "Invalid or expired token. Please sign in again."
            });
        }

        req.user = user;
        next();
    });
}

// Role authorization middleware
function allowRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You are not authorized to access this resource."
            });
        }

        next();
    };
}

// Home route
app.get("/", (req, res) => {
    res.send("JobHub API is running!");
});

// Health check
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS connected");

        res.json({
            status: "ok",
            message: "JobHub API and database are working.",
            database: rows[0].connected === 1 ? "connected" : "unknown"
        });
    } catch (error) {
        console.error("Health check failed:", error.message);

        res.status(500).json({
            status: "error",
            message: "Database connection failed."
        });
    }
});

// SIGNUP
// Student and Company registration are public.
// Admin registration requires a secret stored on the server.
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password, role, adminCode } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Please provide name, email, password, and role."
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedRole = String(role).trim().toLowerCase();

        if (!["student", "company", "admin"].includes(normalizedRole)) {
            return res.status(400).json({
                message: "Please choose a valid account type."
            });
        }

        // Verify the Admin registration code.
        if (normalizedRole === "admin") {
            const expectedAdminCode =
                process.env.ADMIN_REGISTRATION_CODE;

            if (!expectedAdminCode) {
                return res.status(500).json({
                    message:
                        "Admin registration is not configured on the server."
                });
            }

            if (
                typeof adminCode !== "string" ||
                adminCode.trim() !== expectedAdminCode
            ) {
                return res.status(403).json({
                    message: "Invalid admin registration code."
                });
            }
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            `INSERT INTO users
                (full_name, email, password_hash, role)
             VALUES (?, ?, ?, ?)`,
            [
                normalizedName,
                normalizedEmail,
                passwordHash,
                normalizedRole
            ]
        );

        return res.status(201).json({
            message: "Account created successfully. Please sign in.",
            userId: result.insertId
        });
    } catch (error) {
        console.error("Signup error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        return res.status(500).json({
            message: "Unable to create account."
        });
    }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await db.execute(
            `SELECT id, full_name, email, password_hash, role
             FROM users
             WHERE email = ?`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Server authentication is not configured."
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Unable to log in."
        });
    }
});

// STUDENT: View approved jobs
app.get(
    "/api/jobs",
    authenticateToken,
    allowRoles("student"),
    async (req, res) => {
        try {
            const [jobs] = await db.execute(
                `SELECT
                    j.id,
                    j.title,
                    j.description,
                    j.location,
                    j.job_type,
                    j.salary,
                    j.skills,
                    j.created_at,
                    u.full_name AS company_name
                 FROM jobs j
                 INNER JOIN users u ON j.company_id = u.id
                 WHERE j.status = 'approved'
                 ORDER BY j.created_at DESC`
            );

            return res.json(jobs);
        } catch (error) {
            console.error("Load jobs error:", error.message);

            return res.status(500).json({
                message: "Unable to load jobs."
            });
        }
    }
);

// COMPANY: Post a job (requires admin approval)
app.post(
    "/api/company/jobs",
    authenticateToken,
    allowRoles("company"),
    async (req, res) => {
        try {
            const {
                title,
                description,
                location,
                job_type,
                salary,
                skills
            } = req.body;

            if (!title || !description) {
                return res.status(400).json({
                    message: "Job title and description are required."
                });
            }

            const [result] = await db.execute(
                `INSERT INTO jobs
                    (company_id, title, description, location,
                     job_type, salary, skills, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    req.user.id,
                    title.trim(),
                    description.trim(),
                    location || null,
                    job_type || null,
                    salary || null,
                    skills || null
                ]
            );

            return res.status(201).json({
                message: "Job submitted for admin approval.",
                jobId: result.insertId
            });
        } catch (error) {
            console.error("Post job error:", error.message);

            return res.status(500).json({
                message: "Unable to post job."
            });
        }
    }
);

// COMPANY: View own jobs
app.get(
    "/api/company/jobs",
    authenticateToken,
    allowRoles("company"),
    async (req, res) => {
        try {
            const [jobs] = await db.execute(
                `SELECT *
                 FROM jobs
                 WHERE company_id = ?
                 ORDER BY created_at DESC`,
                [req.user.id]
            );

            return res.json(jobs);
        } catch (error) {
            console.error("Company jobs error:", error.message);

            return res.status(500).json({
                message: "Unable to load company jobs."
            });
        }
    }
);

// ADMIN: View jobs awaiting approval
app.get(
    "/api/admin/jobs/pending",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const [jobs] = await db.execute(
                `SELECT
                    j.*,
                    u.full_name AS company_name,
                    u.email AS company_email
                 FROM jobs j
                 INNER JOIN users u ON j.company_id = u.id
                 WHERE j.status = 'pending'
                 ORDER BY j.created_at ASC`
            );

            return res.json(jobs);
        } catch (error) {
            console.error("Pending jobs error:", error.message);

            return res.status(500).json({
                message: "Unable to load pending jobs."
            });
        }
    }
);

// ADMIN: Approve or reject a job
app.patch(
    "/api/admin/jobs/:id/status",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const { status } = req.body;
            const jobId = Number(req.params.id);

            if (!Number.isInteger(jobId) || jobId <= 0) {
                return res.status(400).json({
                    message: "Invalid job ID."
                });
            }

            if (!["approved", "rejected"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be approved or rejected."
                });
            }

            const [result] = await db.execute(
                `UPDATE jobs
                 SET status = ?
                 WHERE id = ? AND status = 'pending'`,
                [status, jobId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Pending job not found."
                });
            }

            return res.json({
                message: `Job ${status} successfully.`
            });
        } catch (error) {
            console.error("Update job status error:", error.message);

            return res.status(500).json({
                message: "Unable to update job status."
            });
        }
    }
);

// STUDENT: Apply for an approved job
app.post(
    "/api/jobs/:id/apply",
    authenticateToken,
    allowRoles("student"),
    async (req, res) => {
        try {
            const jobId = Number(req.params.id);
            const { resume_path, cover_letter } = req.body || {};

            if (!Number.isInteger(jobId) || jobId <= 0) {
                return res.status(400).json({
                    message: "Invalid job ID."
                });
            }

            const [jobs] = await db.execute(
                "SELECT id FROM jobs WHERE id = ? AND status = 'approved'",
                [jobId]
            );

            if (jobs.length === 0) {
                return res.status(404).json({
                    message: "Approved job not found."
                });
            }

            const [result] = await db.execute(
                `INSERT INTO applications
                    (job_id, student_id, resume_path, cover_letter)
                 VALUES (?, ?, ?, ?)`,
                [
                    jobId,
                    req.user.id,
                    resume_path || null,
                    cover_letter || null
                ]
            );

            return res.status(201).json({
                message: "Application submitted successfully.",
                applicationId: result.insertId
            });
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "You have already applied for this job."
                });
            }

            console.error("Apply job error:", error.message);

            return res.status(500).json({
                message: "Unable to submit application."
            });
        }
    }
);

// STUDENT: View own applications
app.get(
    "/api/student/applications",
    authenticateToken,
    allowRoles("student"),
    async (req, res) => {
        try {
            const [applications] = await db.execute(
                `SELECT
                    a.id,
                    a.status,
                    a.applied_at,
                    a.resume_path,
                    a.cover_letter,
                    j.title AS job_title,
                    u.full_name AS company_name
                 FROM applications a
                 INNER JOIN jobs j ON a.job_id = j.id
                 INNER JOIN users u ON j.company_id = u.id
                 WHERE a.student_id = ?
                 ORDER BY a.applied_at DESC`,
                [req.user.id]
            );

            return res.json(applications);
        } catch (error) {
            console.error("Student applications error:", error.message);

            return res.status(500).json({
                message: "Unable to load applications."
            });
        }
    }
);

// COMPANY: View applications for its jobs
app.get(
    "/api/company/applications",
    authenticateToken,
    allowRoles("company"),
    async (req, res) => {
        try {
            const [applications] = await db.execute(
                `SELECT
                    a.id AS application_id,
                    a.status,
                    a.applied_at,
                    a.resume_path,
                    a.cover_letter,
                    j.id AS job_id,
                    j.title AS job_title,
                    s.id AS student_id,
                    s.full_name AS student_name,
                    s.email AS student_email
                 FROM applications a
                 INNER JOIN jobs j ON a.job_id = j.id
                 INNER JOIN users s ON a.student_id = s.id
                 WHERE j.company_id = ?
                 ORDER BY a.applied_at DESC`,
                [req.user.id]
            );

            return res.json(applications);
        } catch (error) {
            console.error("Company applications error:", error.message);

            return res.status(500).json({
                message: "Unable to load applications."
            });
        }
    }
);

// COMPANY: Shortlist or reject an applicant
app.patch(
    "/api/company/applications/:id/status",
    authenticateToken,
    allowRoles("company"),
    async (req, res) => {
        try {
            const applicationId = Number(req.params.id);
            const { status } = req.body;

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                return res.status(400).json({
                    message: "Invalid application ID."
                });
            }

            if (!["shortlisted", "rejected"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be shortlisted or rejected."
                });
            }

            const [result] = await db.execute(
                `UPDATE applications a
                 INNER JOIN jobs j ON a.job_id = j.id
                 SET a.status = ?,
                     a.admin_approval = 'pending'
                 WHERE a.id = ?
                   AND j.company_id = ?
                   AND a.status = 'applied'`,
                [status, applicationId, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Application not found or already reviewed."
                });
            }

            return res.json({
                message: `Applicant ${status} successfully.`
            });
        } catch (error) {
            console.error("Review application error:", error.message);

            return res.status(500).json({
                message: "Unable to update application."
            });
        }
    }
);

// ADMIN: View shortlisted applicants awaiting approval
app.get(
    "/api/admin/shortlist-approvals",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const [applications] = await db.execute(
                `SELECT
                    a.id AS application_id,
                    a.status,
                    a.admin_approval,
                    a.applied_at,
                    j.title AS job_title,
                    c.full_name AS company_name,
                    s.full_name AS student_name,
                    s.email AS student_email
                 FROM applications a
                 INNER JOIN jobs j ON a.job_id = j.id
                 INNER JOIN users c ON j.company_id = c.id
                 INNER JOIN users s ON a.student_id = s.id
                 WHERE a.status = 'shortlisted'
                   AND a.admin_approval = 'pending'
                 ORDER BY a.applied_at ASC`
            );

            return res.json(applications);
        } catch (error) {
            console.error("Shortlist approvals error:", error.message);

            return res.status(500).json({
                message: "Unable to load shortlist approvals."
            });
        }
    }
);

// ADMIN: Approve or reject shortlisted applicants
app.patch(
    "/api/admin/applications/:id/approval",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const applicationId = Number(req.params.id);
            const { approval } = req.body;

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                return res.status(400).json({
                    message: "Invalid application ID."
                });
            }

            if (!["approved", "rejected"].includes(approval)) {
                return res.status(400).json({
                    message: "Approval must be approved or rejected."
                });
            }

            const newStatus =
                approval === "approved" ? "selected" : "rejected";

            const [result] = await db.execute(
                `UPDATE applications
                 SET status = ?, admin_approval = ?
                 WHERE id = ?
                   AND status = 'shortlisted'
                   AND admin_approval = 'pending'`,
                [newStatus, approval, applicationId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Pending shortlist approval not found."
                });
            }

            return res.json({
                message:
                    approval === "approved"
                        ? "Student selected successfully."
                        : "Shortlist rejected successfully."
            });
        } catch (error) {
            console.error("Shortlist decision error:", error.message);

            return res.status(500).json({
                message: "Unable to process shortlist approval."
            });
        }
    }
);

// STUDENT: Dashboard counts
app.get(
    "/api/student/dashboard",
    authenticateToken,
    allowRoles("student"),
    async (req, res) => {
        try {
            const [jobs] = await db.execute(
                "SELECT COUNT(*) AS total FROM jobs WHERE status = 'approved'"
            );

            const [applications] = await db.execute(
                "SELECT COUNT(*) AS total FROM applications WHERE student_id = ?",
                [req.user.id]
            );

            const [shortlisted] = await db.execute(
                "SELECT COUNT(*) AS total FROM applications WHERE student_id = ? AND status = 'shortlisted'",
                [req.user.id]
            );

            const [selected] = await db.execute(
                "SELECT COUNT(*) AS total FROM applications WHERE student_id = ? AND status = 'selected'",
                [req.user.id]
            );

            return res.json({
                availableJobs: jobs[0].total,
                applications: applications[0].total,
                shortlisted: shortlisted[0].total,
                selected: selected[0].total
            });
        } catch (error) {
            console.error("Student dashboard error:", error.message);

            return res.status(500).json({
                message: "Unable to load dashboard."
            });
        }
    }
);

// Keep this as the only app.listen() in this file.
// Render supplies process.env.PORT.
app.listen(PORT, "0.0.0.0", () => {
    console.log(`JobHub server running on port ${PORT}`);
});