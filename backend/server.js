const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const listRoutes = require('./routes/listRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize MySQL Relational Database & Seed standard folders
db.initializeDatabase();

// Middlewares
app.use(cors({
    origin: '*', // Allows clean React frontend connections
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount MVC Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root Health Ping
app.get('/', (req, res) => {
    res.json({ message: 'Smart Tasks API Server running successfully.' });
});

// Global Fallback Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ error: 'Internal server error occurred.' });
});

// Run Listening
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  Smart Tasks Express API Server active on port ${PORT}`);
    console.log(`  Access URL: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
