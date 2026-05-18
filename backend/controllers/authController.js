const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'smart_tasks_super_secret_jwt_key_123', {
        expiresIn: '30d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password || name.trim() === '' || email.trim() === '' || password.length < 6) {
        return res.status(400).json({ error: 'Please provide valid details. Password must be at least 6 characters.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    try {
        // Check if user already exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'An account is already registered with this email.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert User
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name.trim(), trimmedEmail, hashedPassword]
        );

        const userId = result.insertId;

        // Auto-seed default task lists (Personal, Work, etc.) for this new user!
        await db.seedDefaultLists(userId);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: userId,
                name: name.trim(),
                email: trimmedEmail,
                token: generateToken(userId)
            }
        });

    } catch (err) {
        console.error('Registration failed:', err.message);
        res.status(500).json({ error: 'Server error during registration.' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || email.trim() === '' || password === '') {
        return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    try {
        // Find user by email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password credentials.' });
        }

        const user = users[0];

        // Match hashes
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password credentials.' });
        }

        // Record a login activity log
        await db.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [
            user.id,
            'User logged into session.'
        ]);

        res.json({
            message: 'Success',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id)
            }
        });

    } catch (err) {
        console.error('Login failed:', err.message);
        res.status(500).json({ error: 'Server error during authentication.' });
    }
};

// @desc    Get user profile details
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        // Retrieve dynamic logs summary
        const [logs] = await db.query(
            'SELECT action, timestamp FROM activity_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10',
            [req.user.id]
        );

        res.json({
            user: req.user,
            activityHistory: logs
        });
    } catch (err) {
        console.error('Fetch profile logs failed:', err.message);
        res.status(500).json({ error: 'Server error loading profile metrics.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};
