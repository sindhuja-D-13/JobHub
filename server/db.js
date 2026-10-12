
require("dotenv").config();

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Enable SSL when DB_SSL=true (required for your Aiven setup)
let sslOptions;

if (process.env.DB_SSL === "true") {
    const caPath = path.join(__dirname, "ca.pem");

    if (!fs.existsSync(caPath)) {
        throw new Error(
            "Database SSL is enabled, but server/ca.pem was not found."
        );
    }

    sslOptions = {
        ca: fs.readFileSync(caPath, "utf8"),
        rejectUnauthorized: true
    };
}

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jobhub_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    ssl: sslOptions
});

// Check the connection when the server starts
async function checkConnection() {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.ping();

        console.log("MySQL connected successfully!");
        console.log("Database:", process.env.DB_NAME || "jobhub_db");
    } catch (error) {
        console.error("MySQL connection failed!");
        console.error("Error code:", error.code || "UNKNOWN");
        console.error("Error message:", error.message);

        // Do not print passwords or other credentials.
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

checkConnection();

module.exports = pool;
