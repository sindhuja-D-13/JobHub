
const mysql = require("mysql2/promise");
require("dotenv").config();

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jobhub_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // SSL is required for the Aiven online database
    ssl: process.env.DB_SSL === "true"
        ? { rejectUnauthorized: true }
        : undefined
});

// Check MySQL connection
async function checkConnection() {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.ping();

        console.log("MySQL connected successfully!");
        console.log("Database:", process.env.DB_NAME || "jobhub_db");
        console.log("Host:", process.env.DB_HOST || "localhost");
    } catch (error) {
        console.error("MySQL connection failed!");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

checkConnection();

module.exports = pool;
