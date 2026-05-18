// SmartFlow Task Management Web Application - Full-stack Node.js Backend Server
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. DATABASE CONFIGURATION (SQLite)
// ==========================================
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Create Users Table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Tasks Table
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'Personal',
                priority TEXT DEFAULT 'Medium', -- Low, Medium, High
                status TEXT DEFAULT 'Pending',   -- Pending, Completed, Overdue
                due_date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create Indexes for optimized query execution
        db.run(`CREATE INDEX IF NOT EXISTS idx_user_tasks ON tasks(user_id, status, due_date)`);
        console.log('Database schema successfully verified. Waiting for fresh user registrations.');
    });
}

// ==========================================
// 2. EXPRESS MIDDLEWARE SETUP
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'smartflow_super_secure_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 Hours
        secure: false // Set to true if running over HTTPS
    }
}));

// Session Enforcer Auth Guard
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized session. Please log in.' });
    }
    // Auto update overdue tasks on request
    const todayStr = new Date().toISOString().split('T')[0];
    db.run(
        "UPDATE tasks SET status = 'Overdue' WHERE user_id = ? AND status = 'Pending' AND due_date < ?",
        [req.session.user.id, todayStr],
        (err) => {
            if (err) console.error('Overdue check failed:', err.message);
            next();
        }
    );
};

// ==========================================
// 3. AUTHENTICATION REST API ENDPOINTS
// ==========================================

// Register Account
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password || name.trim() === '' || email.trim() === '' || password.length < 6) {
        return res.status(400).json({ error: 'Invalid name, email or password (min 6 characters).' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    db.get("SELECT id FROM users WHERE email = ?", [trimmedEmail], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database query error.' });
        if (row) return res.status(400).json({ error: 'Email already exists.' });

        const hashedPassword = bcrypt.hashSync(password, 10);
        
        db.run(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name.trim(), trimmedEmail, hashedPassword],
            function(err) {
                if (err) return res.status(500).json({ error: 'Failed to create user account.' });

                const sessionUser = { id: this.lastID, name: name.trim(), email: trimmedEmail };
                req.session.user = sessionUser;
                res.status(201).json({ message: 'Success', user: sessionUser });
            }
        );
    });
});

// Login Account
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || email.trim() === '' || password === '') {
        return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    db.get("SELECT * FROM users WHERE email = ?", [trimmedEmail], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database validation error.' });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid email or password credentials.' });
        }

        const sessionUser = { id: user.id, name: user.name, email: user.email };
        req.session.user = sessionUser;
        res.json({ message: 'Success', user: sessionUser });
    });
});

// Logout Session
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Failed to destroy session.' });
        res.json({ message: 'Logged out successfully.' });
    });
});

// Retrieve Active Session
app.get('/api/auth/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// ==========================================
// 4. TASK MANAGEMENT CRUD ENDPOINTS
// ==========================================

// Get Filtered Task List
app.get('/api/tasks', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const { search, category, priority, status } = req.query;

    let query = "SELECT * FROM tasks WHERE user_id = ?";
    const params = [userId];

    if (search && search.trim() !== '') {
        query += " AND (title LIKE ? OR description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category.trim() !== '') {
        query += " AND category = ?";
        params.push(category);
    }
    if (priority && priority.trim() !== '') {
        query += " AND priority = ?";
        params.push(priority);
    }
    if (status && status.trim() !== '') {
        query += " AND status = ?";
        params.push(status);
    }

    query += " ORDER BY due_date ASC, created_at DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database fetch failed.' });
        res.json(rows);
    });
});

// Create New Task
app.post('/api/tasks', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const { title, description, category, priority, status, due_date } = req.body;

    if (!title || !due_date || title.trim() === '' || due_date === '') {
        return res.status(400).json({ error: 'Title and Due Date are mandatory.' });
    }

    // Determine default status on insert based on date
    let taskStatus = status || 'Pending';
    const todayStr = new Date().toISOString().split('T')[0];
    if (taskStatus === 'Pending' && due_date < todayStr) {
        taskStatus = 'Overdue';
    }

    db.run(
        `INSERT INTO tasks (user_id, title, description, category, priority, status, due_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, title.trim(), description || '', category || 'Personal', priority || 'Medium', taskStatus, due_date],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create task.' });
            
            db.get("SELECT * FROM tasks WHERE id = ?", [this.lastID], (err, row) => {
                if (err) return res.status(500).json({ error: 'Fetch created task failed.' });
                res.status(201).json(row);
            });
        }
    );
});

// Update Existing Task
app.put('/api/tasks/:id', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const taskId = req.params.id;
    const { title, description, category, priority, status, due_date } = req.body;

    if (!title || !due_date || title.trim() === '' || due_date === '') {
        return res.status(400).json({ error: 'Title and Due Date are mandatory.' });
    }

    // Check overdue
    let taskStatus = status || 'Pending';
    const todayStr = new Date().toISOString().split('T')[0];
    if (taskStatus === 'Pending' && due_date < todayStr) {
        taskStatus = 'Overdue';
    } else if (taskStatus === 'Overdue' && due_date >= todayStr) {
        taskStatus = 'Pending';
    }

    db.run(
        `UPDATE tasks 
         SET title = ?, description = ?, category = ?, priority = ?, status = ?, due_date = ? 
         WHERE id = ? AND user_id = ?`,
        [title.trim(), description || '', category || 'Personal', priority || 'Medium', taskStatus, due_date, taskId, userId],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to modify task.' });
            if (this.changes === 0) return res.status(404).json({ error: 'Task not found or forbidden.' });

            db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, row) => {
                res.json(row);
            });
        }
    );
});

// Delete Task
app.delete('/api/tasks/:id', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const taskId = req.params.id;

    db.run("DELETE FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to delete task.' });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found or forbidden.' });
        res.json({ message: 'Task deleted successfully.' });
    });
});

// Toggle Task Status (Pending <-> Completed)
app.patch('/api/tasks/:id/toggle', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const taskId = req.params.id;

    db.get("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId], (err, task) => {
        if (err) return res.status(500).json({ error: 'Fetch task failed.' });
        if (!task) return res.status(404).json({ error: 'Task not found.' });

        let newStatus = 'Completed';
        if (task.status === 'Completed') {
            const todayStr = new Date().toISOString().split('T')[0];
            newStatus = task.due_date < todayStr ? 'Overdue' : 'Pending';
        }

        db.run("UPDATE tasks SET status = ? WHERE id = ?", [newStatus, taskId], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to update status.' });
            
            db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, updatedTask) => {
                res.json(updatedTask);
            });
        });
    });
});

// ==========================================
// 5. PRODUCTIVITY ANALYTICS ENDPOINT
// ==========================================
app.get('/api/analytics', requireAuth, (req, res) => {
    const userId = req.session.user.id;

    const stats = {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        weeklyTrend: [],
        categories: {
            'Personal': 0,
            'Work': 0,
            'College': 0,
            'Health': 0,
            'Shopping': 0
        },
        score: 0
    };

    // Gather distributions
    db.all("SELECT status, category, due_date FROM tasks WHERE user_id = ?", [userId], (err, tasksList) => {
        if (err) return res.status(500).json({ error: 'Fetch tasks failed.' });

        stats.total = tasksList.length;
        tasksList.forEach(t => {
            if (t.status === 'Completed') {
                stats.completed++;
                stats.categories[t.category] = (stats.categories[t.category] || 0) + 1;
            } else if (t.status === 'Pending') {
                stats.pending++;
            } else if (t.status === 'Overdue') {
                stats.overdue++;
            }
        });

        // Compute Score
        stats.score = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        // Fetch Weekly Trend completions (Last 7 days)
        const weeklyData = [];
        const today = new Date();

        const countCompletions = (dateStr) => {
            return tasksList.filter(t => t.status === 'Completed' && t.due_date === dateStr).length;
        };

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            weeklyData.push({
                label: dayLabel,
                completions: countCompletions(dateStr)
            });
        }
        stats.weeklyTrend = weeklyData;

        res.json(stats);
    });
});

// ==========================================
// 6. PROFILE PREFERENCES ENDPOINT
// ==========================================
app.put('/api/profile', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const { name, email, password } = req.body;

    if (!name || !email || name.trim() === '' || email.trim() === '') {
        return res.status(400).json({ error: 'Name and Email are mandatory.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check email uniqueness
    db.get("SELECT id FROM users WHERE email = ? AND id != ?", [trimmedEmail, userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Uniqueness validation failed.' });
        if (row) return res.status(400).json({ error: 'Email already taken.' });

        let query = "UPDATE users SET name = ?, email = ? WHERE id = ?";
        const params = [name.trim(), trimmedEmail];

        if (password && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters.' });
            }
            query = "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?";
            params.push(bcrypt.hashSync(password, 10));
        }

        params.push(userId); // Add user id constraint to the end

        db.run(query, params, function(err) {
            if (err) return res.status(500).json({ error: 'Failed to update profile.' });
            
            const updatedUser = { id: userId, name: name.trim(), email: trimmedEmail };
            req.session.user = updatedUser;
            res.json({ message: 'Success', user: updatedUser });
        });
    });
});

// Catch-all route to serve the SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  SmartFlow Web Application started on port ${PORT}`);
    console.log(`  Access URL: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
