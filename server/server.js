
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./db");
const app = express();

// ==================== MIDDLEWARE ====================

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ]
    })
);

app.use(express.json());

// ==================== TEST ROUTES ====================

app.get("/", (req, res) => {
    res.send("JobHub API is running!");
});

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            message: "JobHub API is running!",
            database: "Connected"
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(500).json({
            message: "Database connection failed."
        });
    }
});

// ==================== AUTHENTICATION MIDDLEWARE ====================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
        return res.status(401).json({
            message: "Please sign in first."
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            message: "JWT_SECRET is not configured."
        });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Your session is invalid or expired. Please sign in again."
        });
    }
}

function allowRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You are not authorized to perform this action."
            });
        }

        next();
    };
}

// ==================== SIGN UP ====================


app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password, role, adminCode } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        const cleanRole =
            typeof role === "string" ? role.toLowerCase() : "";

        // Allow only the supported account types.
        if (!["student", "company", "admin"].includes(cleanRole)) {
            return res.status(400).json({
                message: "Please select a valid account type."
            });
        }

        // Admin registration requires a secret stored on the backend.
        if (cleanRole === "admin") {
            if (!process.env.ADMIN_REGISTRATION_CODE) {
                console.error(
                    "ADMIN_REGISTRATION_CODE is missing from .env"
                );

                return res.status(500).json({
                    message: "Admin registration is not configured."
                });
            }

            if (
                typeof adminCode !== "string" ||
                adminCode !== process.env.ADMIN_REGISTRATION_CODE
            ) {
                return res.status(403).json({
                    message: "Invalid admin registration code."
                });
            }
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        const [existing] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "This email is already registered. Please sign in."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            `INSERT INTO users
                (full_name, email, password_hash, role)
             VALUES (?, ?, ?, ?)`,
            [cleanName, cleanEmail, passwordHash, cleanRole]
        );

        return res.status(201).json({
            message: "Account created successfully! Please sign in.",
            userId: result.insertId
        });
    } catch (error) {
        console.error("Signup error:", error.code, error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        return res.status(500).json({
            message: "Registration failed. Check the server terminal."
        });
    }
});


// ==================== SIGN IN ====================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Enter your email and password."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await db.execute(
            `SELECT id, full_name, email, password_hash, role
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "JWT_SECRET is missing from the .env file."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.code, error.message);

        return res.status(500).json({
            message: "Login failed. Check the server terminal."
        });
    }
});

// ==================== ACCOUNT PROFILE ====================

app.put("/api/account/profile", authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Please enter your name."
            });
        }

        const cleanName = name.trim();

        if (cleanName.length > 100) {
            return res.status(400).json({
                message: "Name must be 100 characters or fewer."
            });
        }

        await db.execute(
            "UPDATE users SET full_name = ? WHERE id = ?",
            [cleanName, req.user.id]
        );

        const [users] = await db.execute(
            "SELECT id, full_name, email, role FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Account not found."
            });
        }

        const user = users[0];

        return res.json({
            message: "Profile name updated successfully.",
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Profile update error:", error.code, error.message);

        return res.status(500).json({
            message: "Unable to update your profile."
        });
    }
});

// ==================== COMPANY: POST A JOB ====================

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

            if (
                typeof title !== "string" ||
                typeof description !== "string" ||
                !title.trim() ||
                !description.trim()
            ) {
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
                message: "Job submitted. Waiting for admin approval.",
                jobId: result.insertId,
                status: "pending"
            });
        } catch (error) {
            console.error("Post job error:", error.code, error.message);

            return res.status(500).json({
                message: "Unable to post job."
            });
        }
    }
);

// ==================== STUDENT: VIEW APPROVED JOBS ====================

app.get(
    "/api/jobs",
    authenticateToken,
    allowRoles("student"),
    async (req, res) => {
        try {
            const [jobs] = await db.execute(
                `SELECT
                    j.id,
                    j.company_id,
                    j.title,
                    j.description,
                    j.location,
                    j.job_type,
                    j.salary,
                    j.skills,
                    j.created_at,
                    u.full_name AS company_name
                 FROM jobs j
                 JOIN users u ON u.id = j.company_id
                 WHERE j.status = 'approved'
                 ORDER BY j.created_at DESC`
            );

            return res.json(jobs);
        } catch (error) {
            console.error("Fetch jobs error:", error.code, error.message);

            return res.status(500).json({
                message: "Unable to load jobs."
            });
        }
    }
);

// ==================== STUDENT: DASHBOARD STATISTICS ====================

app.get(
    "/api/student/dashboard",
    authenticateToken,
    allowRoles("student"),
    async (req, res) => {
        try {
            const studentId = req.user.id;

            const [jobRows] = await db.execute(
                `SELECT COUNT(*) AS total
                 FROM jobs
                 WHERE status = 'approved'`
            );

            const [applicationRows] = await db.execute(
                `SELECT
                    COUNT(*) AS total
                 FROM applications
                 WHERE student_id = ?`,
                [studentId]
            );

            const [[selectionCount]] = await db.execute(
                `SELECT COUNT(*) AS total
                 FROM applications
                 WHERE student_id = ?
                   AND status = 'selected'
                   AND admin_approval = 'approved'`,
                [studentId]
            );

            const [selectionRows] = await db.execute(
                `SELECT
                    j.title AS job_title,
                    c.full_name AS company_name
                 FROM applications a
                 INNER JOIN jobs j ON j.id = a.job_id
                 INNER JOIN users c ON c.id = j.company_id
                 WHERE a.student_id = ?
                   AND a.status = 'selected'
                   AND a.admin_approval = 'approved'
                 ORDER BY a.applied_at DESC
                 LIMIT 1`,
                [studentId]
            );

            return res.json({
                availableJobs: Number(jobRows[0].total),
                applications: Number(applicationRows[0].total),
                selected: Number(selectionCount.total),
                selection: selectionRows[0] || null
            });
        } catch (error) {
            console.error(
                "Student dashboard error:",
                error.code,
                error.message
            );

            return res.status(500).json({
                message: "Unable to load dashboard statistics."
            });
        }
    }
);

// ==================== STUDENT: VIEW MY APPLICATIONS ====================

app.post(
    "/api/student/applications/:jobId",
    authenticateToken,
    allowRoles("student"),
    async (req, res) => {
        try {
            const jobId = Number(req.params.jobId);

            if (!Number.isInteger(jobId) || jobId < 1) {
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
                    message: "This job is unavailable or has not been approved."
                });
            }

            const [existingApplications] = await db.execute(
                "SELECT id FROM applications WHERE student_id = ? AND job_id = ?",
                [req.user.id, jobId]
            );

            if (existingApplications.length > 0) {
                return res.status(409).json({
                    message: "You have already applied for this job."
                });
            }

            const [result] = await db.execute(
                `INSERT INTO applications
                    (student_id, job_id, status, applied_at)
                 VALUES (?, ?, 'applied', CURRENT_TIMESTAMP)`,
                [req.user.id, jobId]
            );

            return res.status(201).json({
                message: "Your application has been submitted successfully.",
                applicationId: result.insertId,
                jobId,
                status: "applied"
            });
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "You have already applied for this job."
                });
            }

            console.error(
                "Submit application error:",
                error.code,
                error.message
            );

            return res.status(500).json({
                message: "Unable to submit your application."
            });
        }
    }
);

app.get(
    "/api/student/applications",
    authenticateToken,
    allowRoles("student"),
    async (req, res) => {
        try {
            const studentId = req.user.id;

            const [rows] = await db.execute(
                `SELECT
                    a.id,
                    a.status,
                    a.applied_at,
                    j.title AS job_title,
                    u.full_name AS company_name
                 FROM applications a
                 INNER JOIN jobs j ON a.job_id = j.id
                 INNER JOIN users u ON j.company_id = u.id
                 WHERE a.student_id = ?
                 ORDER BY a.applied_at DESC`,
                [studentId]
            );

            return res.json(rows);
        } catch (error) {
            console.error(
                "Load applications error:",
                error.code,
                error.message
            );

            return res.status(500).json({
                message: "Unable to load applications."
            });
        }
    }
);

// ==================== ADMIN: ACCOUNT DIRECTORIES ====================

app.get(
    "/api/admin/students",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const [students] = await db.execute(
                `SELECT id, full_name, email, created_at
                 FROM users
                 WHERE role = 'student'
                 ORDER BY created_at DESC, id DESC`
            );

            return res.json(students);
        } catch (error) {
            console.error("Admin students error:", error.code, error.message);

            return res.status(500).json({
                message: "Unable to load registered students."
            });
        }
    }
);

app.get(
    "/api/admin/companies",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const [companies] = await db.execute(
                `SELECT id, full_name, email, created_at
                 FROM users
                 WHERE role = 'company'
                 ORDER BY created_at DESC, id DESC`
            );

            return res.json(companies);
        } catch (error) {
            console.error("Admin companies error:", error.code, error.message);

            return res.status(500).json({
                message: "Unable to load registered companies."
            });
        }
    }
);

app.get(
    "/api/admin/dashboard",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const [[studentCount]] = await db.execute(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'student'"
            );
            const [[companyCount]] = await db.execute(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'company'"
            );
            const [[jobCount]] = await db.execute(
                "SELECT COUNT(*) AS total FROM jobs WHERE status = 'pending'"
            );
            const [[shortlistCount]] = await db.execute(
                `SELECT COUNT(*) AS total
                 FROM applications
                 WHERE status = 'shortlisted'
                   AND admin_approval = 'pending'`
            );

            return res.json({
                students: Number(studentCount.total),
                companies: Number(companyCount.total),
                pendingJobs: Number(jobCount.total),
                pendingShortlists: Number(shortlistCount.total)
            });
        } catch (error) {
            console.error("Admin dashboard error:", error.code, error.message);

            return res.status(500).json({
                message: "Unable to load dashboard statistics."
            });
        }
    }
);

app.get(
    "/api/admin/shortlist-approvals",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const [applications] = await db.execute(
                `SELECT
                    a.id,
                    a.status,
                    a.admin_approval,
                    a.applied_at,
                    j.title AS job_title,
                    c.full_name AS company_name,
                    s.full_name AS student_name,
                    s.email AS student_email
                 FROM applications a
                 INNER JOIN jobs j ON j.id = a.job_id
                 INNER JOIN users c ON c.id = j.company_id
                 INNER JOIN users s ON s.id = a.student_id
                 WHERE a.status = 'shortlisted'
                    OR a.admin_approval IN ('approved', 'rejected')
                 ORDER BY
                    (a.admin_approval = 'pending') DESC,
                    a.applied_at DESC`
            );

            return res.json(applications);
        } catch (error) {
            console.error(
                "Admin shortlist approvals error:",
                error.code,
                error.message
            );

            return res.status(500).json({
                message: "Unable to load shortlist approvals."
            });
        }
    }
);

app.put(
    "/api/admin/applications/:id/shortlist",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        const applicationId = Number(req.params.id);
        const { decision } = req.body;

        if (!Number.isInteger(applicationId) || applicationId < 1) {
            return res.status(400).json({
                message: "Invalid application ID."
            });
        }

        if (!["approved", "rejected"].includes(decision)) {
            return res.status(400).json({
                message: "Choose an approved or rejected decision."
            });
        }

        let connection;

        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            const [rows] = await connection.execute(
                `SELECT id
                 FROM applications
                 WHERE id = ?
                   AND status = 'shortlisted'
                   AND admin_approval = 'pending'
                 FOR UPDATE`,
                [applicationId]
            );

            if (rows.length === 0) {
                await connection.rollback();

                return res.status(409).json({
                    message: "This shortlist has already been reviewed or is unavailable."
                });
            }

            await connection.execute(
                `UPDATE applications
                 SET status = ?, admin_approval = ?
                 WHERE id = ?`,
                [
                    decision === "approved" ? "selected" : "rejected",
                    decision,
                    applicationId
                ]
            );

            await connection.commit();

            return res.json({
                message: `Shortlist ${decision} successfully.`,
                applicationId,
                decision
            });
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error(
                "Shortlist decision error:",
                error.code,
                error.message
            );

            return res.status(500).json({
                message: "Unable to save the shortlist decision."
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);

// ==================== ADMIN: VIEW ALL APPLICATIONS ====================

app.get(
    "/api/admin/applications",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const [applications] = await db.execute(
                `SELECT
                    a.id,
                    a.status,
                    a.applied_at,
                    j.title AS job_title,
                    c.full_name AS company_name,
                    s.full_name AS student_name,
                    s.email AS student_email
                 FROM applications a
                 INNER JOIN jobs j ON j.id = a.job_id
                 INNER JOIN users c ON c.id = j.company_id
                 INNER JOIN users s ON s.id = a.student_id
                 ORDER BY a.applied_at DESC`
            );

            return res.json(applications);
        } catch (error) {
            console.error(
                "Admin applications error:",
                error.code,
                error.message
            );

            return res.status(500).json({
                message: "Unable to load student applications."
            });
        }
    }
);

// ==================== COMPANY: VIEW OWN JOBS ====================

app.get(
    "/api/company/applications",
    authenticateToken,
    allowRoles("company"),
    async (req, res) => {
        try {
            const [applications] = await db.execute(
                `SELECT
                    a.id,
                    a.status,
                    a.admin_approval,
                    a.applied_at,
                    j.id AS job_id,
                    j.title AS job_title,
                    s.full_name AS student_name,
                    s.email AS student_email
                 FROM applications a
                 INNER JOIN jobs j ON j.id = a.job_id
                 INNER JOIN users s ON s.id = a.student_id
                 WHERE j.company_id = ?
                 ORDER BY a.applied_at DESC`,
                [req.user.id]
            );

            return res.json(applications);
        } catch (error) {
            console.error(
                "Company applications error:",
                error.code,
                error.message
            );

            return res.status(500).json({
                message: "Unable to load applications for your jobs."
            });
        }
    }
);

app.put(
    "/api/company/applications/:id/shortlist",
    authenticateToken,
    allowRoles("company"),
    async (req, res) => {
        const applicationId = Number(req.params.id);

        if (!Number.isInteger(applicationId) || applicationId < 1) {
            return res.status(400).json({
                message: "Invalid application ID."
            });
        }

        try {
            const [applications] = await db.execute(
                `SELECT a.status
                 FROM applications a
                 INNER JOIN jobs j ON j.id = a.job_id
                 WHERE a.id = ? AND j.company_id = ?`,
                [applicationId, req.user.id]
            );

            if (applications.length === 0) {
                return res.status(404).json({
                    message: "Application not found for your company."
                });
            }

            if (applications[0].status !== "applied") {
                return res.status(409).json({
                    message: "Only applications with applied status can be shortlisted."
                });
            }

            const [result] = await db.execute(
                `UPDATE applications a
                 INNER JOIN jobs j ON j.id = a.job_id
                 SET a.status = 'shortlisted', a.admin_approval = 'pending'
                 WHERE a.id = ?
                   AND j.company_id = ?
                   AND a.status = 'applied'`,
                [applicationId, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(409).json({
                    message: "This application has already been updated."
                });
            }

            return res.json({
                message: "Candidate shortlisted and sent for admin approval.",
                applicationId,
                status: "shortlisted",
                adminApproval: "pending"
            });
        } catch (error) {
            console.error(
                "Company shortlist error:",
                error.code,
                error.message
            );

            return res.status(500).json({
                message: "Unable to shortlist this candidate."
            });
        }
    }
);

app.get(
    "/api/company/jobs",
    authenticateToken,
    allowRoles("company"),
    async (req, res) => {
        try {
            const [jobs] = await db.execute(
                `SELECT
                    id, title, description, location, job_type,
                    salary, skills, status, created_at
                 FROM jobs
                 WHERE company_id = ?
                 ORDER BY created_at DESC`,
                [req.user.id]
            );

            return res.json(jobs);
        } catch (error) {
            console.error("Company jobs error:", error.code, error.message);

            return res.status(500).json({
                message: "Unable to load your jobs."
            });
        }
    }
);

// ==================== ADMIN: VIEW PENDING JOBS ====================

app.get(
    "/api/admin/jobs/pending",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const [jobs] = await db.execute(
                `SELECT
                    j.id,
                    j.company_id,
                    j.title,
                    j.description,
                    j.location,
                    j.job_type,
                    j.salary,
                    j.skills,
                    j.created_at,
                    u.full_name AS company_name,
                    u.email AS company_email
                 FROM jobs j
                 JOIN users u ON u.id = j.company_id
                 WHERE j.status = 'pending'
                 ORDER BY j.created_at ASC`
            );

            return res.json(jobs);
        } catch (error) {
            console.error("Pending jobs error:", error.code, error.message);

            return res.status(500).json({
                message: "Unable to load pending jobs."
            });
        }
    }
);

// ==================== ADMIN: APPROVE OR REJECT JOB ====================

app.patch(
    "/api/admin/jobs/:id/status",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const jobId = Number(req.params.id);
            const { status } = req.body;

            if (!Number.isInteger(jobId) || jobId < 1) {
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
                    message: "Pending job not found or already reviewed."
                });
            }

            return res.json({
                message: `Job ${status} successfully.`,
                jobId,
                status
            });
        } catch (error) {
            console.error("Job review error:", error.code, error.message);

            return res.status(500).json({
                message: "Unable to update job status."
            });
        }
    }
);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

async function startServer() {
    if (!process.env.JWT_SECRET) {
        console.error("Warning: JWT_SECRET is missing from your .env file.");
    }

    app.listen(PORT, () => {
        console.log(`JobHub server running on port ${PORT}`);
    });
}

startServer();
