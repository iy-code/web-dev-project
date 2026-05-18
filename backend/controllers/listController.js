const db = require('../config/db');

// @desc    Get user task lists
// @route   GET /api/lists
// @access  Private
const getLists = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.query('SELECT * FROM task_lists WHERE user_id = ? ORDER BY created_at ASC', [userId]);
        res.json(rows);
    } catch (err) {
        console.error('Fetch lists failed:', err.message);
        res.status(500).json({ error: 'Server error retrieving task folders.' });
    }
};

// @desc    Create a custom task list
// @route   POST /api/lists
// @access  Private
const createList = async (req, res) => {
    const userId = req.user.id;
    const { list_name, color } = req.body;

    if (!list_name || list_name.trim() === '') {
        return res.status(400).json({ error: 'List name folder cannot be empty.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO task_lists (user_id, list_name, color) VALUES (?, ?, ?)',
            [userId, list_name.trim(), color || '#2563EB']
        );

        // Log Activity
        await db.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [
            userId,
            `Created task folder "${list_name.trim()}".`
        ]);

        const [created] = await db.query('SELECT * FROM task_lists WHERE id = ?', [result.insertId]);
        res.status(201).json(created[0]);

    } catch (err) {
        console.error('List creation failed:', err.message);
        res.status(500).json({ error: 'Server error creating folder.' });
    }
};

// @desc    Update task list folder
// @route   PUT /api/lists/:id
// @access  Private
const updateList = async (req, res) => {
    const userId = req.user.id;
    const listId = req.params.id;
    const { list_name, color } = req.body;

    if (!list_name || list_name.trim() === '') {
        return res.status(400).json({ error: 'List name folder cannot be empty.' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM task_lists WHERE id = ? AND user_id = ?', [listId, userId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Task list folder not found or forbidden.' });
        }

        await db.query(
            'UPDATE task_lists SET list_name = ?, color = ? WHERE id = ?',
            [list_name.trim(), color || '#2563EB', listId]
        );

        // Log Activity
        await db.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [
            userId,
            `Renamed task folder to "${list_name.trim()}".`
        ]);

        const [updated] = await db.query('SELECT * FROM task_lists WHERE id = ?', [listId]);
        res.json(updated[0]);

    } catch (err) {
        console.error('List update failed:', err.message);
        res.status(500).json({ error: 'Server error updating folder.' });
    }
};

// @desc    Delete task list folder
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = async (req, res) => {
    const userId = req.user.id;
    const listId = req.params.id;

    try {
        const [existing] = await db.query('SELECT list_name FROM task_lists WHERE id = ? AND user_id = ?', [listId, userId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Task list folder not found or forbidden.' });
        }

        // Prevent deleting all folders (user must have at least one)
        const [count] = await db.query('SELECT COUNT(*) as total FROM task_lists WHERE user_id = ?', [userId]);
        if (count[0].total <= 1) {
            return res.status(400).json({ error: 'Cannot delete folder. A workspace requires at least one list.' });
        }

        await db.query('DELETE FROM task_lists WHERE id = ?', [listId]);

        // Log Activity
        await db.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [
            userId,
            `Deleted task folder "${existing[0].list_name}".`
        ]);

        res.json({ message: 'Success', list_id: listId });

    } catch (err) {
        console.error('List deletion failed:', err.message);
        res.status(500).json({ error: 'Server error deleting folder.' });
    }
};

module.exports = {
    getLists,
    createList,
    updateList,
    deleteList
};
