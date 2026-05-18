const db = require('../config/db');

// @desc    Get dynamic productivity analytics
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res) => {
    const userId = req.user.id;

    try {
        const stats = {
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
            score: 0,
            folderShares: [],
            weeklyTrend: []
        };

        // 1. Get totals and status aggregates
        const [tasks] = await db.query(
            'SELECT status, list_id, due_date FROM tasks WHERE user_id = ?',
            [userId]
        );

        stats.total = tasks.length;
        
        tasks.forEach(t => {
            if (t.status === 'Completed') stats.completed++;
            else if (t.status === 'Pending') stats.pending++;
            else if (t.status === 'Overdue') stats.overdue++;
            else if (t.status === 'In Progress') stats.pending++; // Treat In Progress as pending workload
        });

        // Calculate dynamic completion score
        stats.score = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        // 2. Get folder/list distribution with color mappings
        const [folders] = await db.query(
            `SELECT l.id, l.list_name, l.color, COUNT(t.id) as count
             FROM task_lists l
             LEFT JOIN tasks t ON l.id = t.list_id AND t.status = 'Completed'
             WHERE l.user_id = ?
             GROUP BY l.id`,
            [userId]
        );
        stats.folderShares = folders;

        // 3. Compile Historical Weekly Completion rates (Last 7 Days)
        const weeklyData = [];
        const today = new Date();

        const countCompletions = (dateStr) => {
            return tasks.filter(t => t.status === 'Completed' && t.due_date === dateStr).length;
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

    } catch (err) {
        console.error('Analytics compilation failed:', err.message);
        res.status(500).json({ error: 'Server error loading analytics.' });
    }
};

module.exports = { getAnalytics };
