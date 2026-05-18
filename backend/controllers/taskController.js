const db = require('../config/db');

// @desc    Get filtered user tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    const userId = req.user.id;
    const { search, list_id, priority, status } = req.query;

    try {
        // Dynamic check & update overdue status
        const todayStr = new Date().toISOString().split('T')[0];
        await db.query(
            "UPDATE tasks SET status = 'Overdue' WHERE user_id = ? AND status = 'Pending' AND due_date < ?",
            [userId, todayStr]
        );

        let query = `
            SELECT t.*, l.list_name, l.color as list_color 
            FROM tasks t
            JOIN task_lists l ON t.list_id = l.id
            WHERE t.user_id = ?
        `;
        const params = [userId];

        if (search && search.trim() !== '') {
            query += " AND (t.title LIKE ? OR t.description LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }
        if (list_id && list_id !== '') {
            query += " AND t.list_id = ?";
            params.push(list_id);
        }
        if (priority && priority !== '') {
            query += " AND t.priority = ?";
            params.push(priority);
        }
        if (status && status !== '') {
            query += " AND t.status = ?";
            params.push(status);
        }

        query += " ORDER BY t.due_date ASC, t.created_at DESC";

        const [rows] = await db.query(query, params);
        res.json(rows);

    } catch (err) {
        console.error('Fetch tasks failed:', err.message);
        res.status(500).json({ error: 'Server error retrieving tasks.' });
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    const userId = req.user.id;
    const { title, description, list_id, priority, due_date, due_time, reminder } = req.body;

    if (!title || !list_id || !due_date || title.trim() === '') {
        return res.status(400).json({ error: 'Title, List folder, and Due Date are mandatory.' });
    }

    try {
        // Check if list belongs to user
        const [list] = await db.query('SELECT id FROM task_lists WHERE id = ? AND user_id = ?', [list_id, userId]);
        if (list.length === 0) {
            return res.status(400).json({ error: 'Invalid task list selection.' });
        }

        // Determine default status based on date
        const todayStr = new Date().toISOString().split('T')[0];
        let status = 'Pending';
        if (due_date < todayStr) {
            status = 'Overdue';
        }

        const isCompleted = status === 'Completed' ? 1 : 0;
        const taskTime = due_time && due_time !== '' ? due_time : '00:00:00';

        const [result] = await db.query(
            `INSERT INTO tasks (user_id, list_id, title, description, priority, status, due_date, due_time, reminder, completed)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                list_id,
                title.trim(),
                description || '',
                priority || 'Medium',
                status,
                due_date,
                taskTime,
                reminder ? 1 : 0,
                isCompleted
            ]
        );

        // Log Activity
        await db.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [
            userId,
            `Created task "${title.trim()}".`
        ]);

        const [created] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        res.status(201).json(created[0]);

    } catch (err) {
        console.error('Task creation failed:', err.message);
        res.status(500).json({ error: 'Server error creating task.' });
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description, list_id, priority, status, due_date, due_time, reminder } = req.body;

    if (!title || !list_id || !due_date || title.trim() === '') {
        return res.status(400).json({ error: 'Title, List folder, and Due Date are mandatory.' });
    }

    try {
        // Validate task ownership
        const [task] = await db.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
        if (task.length === 0) {
            return res.status(404).json({ error: 'Task not found or forbidden access.' });
        }

        // Validate target list ownership
        const [list] = await db.query('SELECT id FROM task_lists WHERE id = ? AND user_id = ?', [list_id, userId]);
        if (list.length === 0) {
            return res.status(400).json({ error: 'Invalid task list selection.' });
        }

        // Determine correct status & completion flag
        let taskStatus = status || 'Pending';
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (taskStatus === 'Pending' && due_date < todayStr) {
            taskStatus = 'Overdue';
        } else if (taskStatus === 'Overdue' && due_date >= todayStr) {
            taskStatus = 'Pending';
        }

        const isCompleted = taskStatus === 'Completed' ? 1 : 0;
        const taskTime = due_time && due_time !== '' ? due_time : '00:00:00';

        await db.query(
            `UPDATE tasks 
             SET title = ?, description = ?, list_id = ?, priority = ?, status = ?, due_date = ?, due_time = ?, reminder = ?, completed = ?
             WHERE id = ? AND user_id = ?`,
            [
                title.trim(),
                description || '',
                list_id,
                priority || 'Medium',
                taskStatus,
                due_date,
                taskTime,
                reminder ? 1 : 0,
                isCompleted,
                taskId,
                userId
            ]
        );

        // Log Activity
        await db.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [
            userId,
            `Modified task "${title.trim()}".`
        ]);

        const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        res.json(updated[0]);

    } catch (err) {
        console.error('Task update failed:', err.message);
        res.status(500).json({ error: 'Server error updating task.' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id;

    try {
        // Fetch details before delete for logging
        const [task] = await db.query('SELECT title FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
        if (task.length === 0) {
            return res.status(404).json({ error: 'Task not found or forbidden access.' });
        }

        await db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);

        // Log Activity
        await db.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [
            userId,
            `Deleted task "${task[0].title}".`
        ]);

        res.json({ message: 'Success', task_id: taskId });

    } catch (err) {
        console.error('Task deletion failed:', err.message);
        res.status(500).json({ error: 'Server error deleting task.' });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
