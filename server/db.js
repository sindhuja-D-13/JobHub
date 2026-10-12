
const mysql = require("mysql2/promise");
require("dotenv").config();

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jobhub_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Check MySQL connection
async function checkConnection() {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.ping();

        console.log("MySQL connected successfully!");
        console.log("Database: jobhub_db");
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