const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_tasks_db'
};

let pool = null;

async function initializeDatabase() {
    try {
        // 1. First establish a connection without a database to see if we can create it
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password
        });

        console.log(`Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        console.log(`Database "${dbConfig.database}" verified/created successfully.`);
        await connection.end();

        // 2. Establish connection pool with selected database
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // 3. Create Tables
        await createTables();

    } catch (err) {
        console.error('CRITICAL: Database initialization failed:', err.message);
        process.exit(1);
    }
}

async function createTables() {
    try {
        // Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // Task Lists Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_lists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                list_name VARCHAR(100) NOT NULL,
                color VARCHAR(7) DEFAULT '#2563EB',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        // Tasks Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                list_id INT NOT NULL,
                title VARCHAR(150) NOT NULL,
                description TEXT,
                priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
                status ENUM('Pending', 'In Progress', 'Completed', 'Overdue') DEFAULT 'Pending',
                due_date DATE NOT NULL,
                due_time TIME DEFAULT '00:00:00',
                reminder TINYINT(1) DEFAULT 0,
                completed TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (list_id) REFERENCES task_lists(id) ON DELETE CASCADE,
                INDEX idx_user_tasks (user_id, status, due_date)
            ) ENGINE=InnoDB;
        `);

        // Activity Log Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        console.log('All MySQL relational tables verified/created successfully.');
    } catch (err) {
        console.error('Error creating relational tables:', err.message);
        throw err;
    }
}

// Helper to seed dynamic default lists for newly registered users
async function seedDefaultLists(userId) {
    try {
        const defaultLists = [
            { name: 'Personal', color: '#3B82F6' },
            { name: 'Work', color: '#10B981' },
            { name: 'College', color: '#F59E0B' },
            { name: 'Shopping', color: '#EC4899' },
            { name: 'Fitness', color: '#8B5CF6' }
        ];

        // Check if user already has lists
        const [existing] = await pool.query('SELECT id FROM task_lists WHERE user_id = ? LIMIT 1', [userId]);
        
        if (existing.length === 0) {
            console.log(`Seeding default list folders for new user ${userId}...`);
            const query = 'INSERT INTO task_lists (user_id, list_name, color) VALUES ?';
            const values = defaultLists.map(list => [userId, list.name, list.color]);
            await pool.query(query, [values]);
            
            // Seed a welcome activity log
            await pool.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [
                userId,
                'Workspace initialized with default task lists.'
            ]);
        }
    } catch (err) {
        console.error(`Failed to seed default folders for user ${userId}:`, err.message);
    }
}

module.exports = {
    initializeDatabase,
    query: (text, params) => pool.query(text, params),
    seedDefaultLists,
    getPool: () => pool
};
