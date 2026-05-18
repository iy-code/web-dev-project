import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import { 
  FiFolder, FiClock, FiCheckCircle, FiAlertCircle, 
  FiPlus, FiTrendingUp, FiTrash2, FiEdit3 
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import Swal from 'sweetalert2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0, weeklyTrend: [] });
  const [recentTasks, setRecentTasks] = useState([]);
  const [activeLists, setActiveLists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Fields
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskListId, setTaskListId] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('00:00:00');
  const [taskReminder, setTaskReminder] = useState(false);
  const [taskStatus, setTaskStatus] = useState('Pending');

  const loadData = async () => {
    try {
      const [resStats, resTasks, resLists] = await Promise.all([
        api.analytics.getAnalytics(),
        api.tasks.getTasks(),
        api.lists.getLists()
      ]);
      setStats(resStats.data);
      setRecentTasks(resTasks.data.slice(0, 5));
      setActiveLists(resLists.data);
      if (resLists.data.length > 0) {
        setTaskListId(resLists.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditId(null);
    setTaskTitle('');
    setTaskDesc('');
    if (activeLists.length > 0) setTaskListId(activeLists[0].id);
    setTaskPriority('Medium');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskDueTime('00:00:00');
    setTaskReminder(false);
    setTaskStatus('Pending');
    setShowModal(true);
  };

  const handleOpenEditModal = (t) => {
    setEditId(t.id);
    setTaskTitle(t.title);
    setTaskDesc(t.description || '');
    setTaskListId(t.list_id);
    setTaskPriority(t.priority);
    setTaskDueDate(t.due_date);
    setTaskDueTime(t.due_time || '00:00:00');
    setTaskReminder(t.reminder === 1);
    setTaskStatus(t.status);
    setShowModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskListId || !taskDueDate) {
      return Swal.fire('Missing Information', 'Please complete the title, list folder, and due date.', 'warning');
    }

    const payload = {
      title: taskTitle,
      description: taskDesc,
      list_id: taskListId,
      priority: taskPriority,
      due_date: taskDueDate,
      due_time: taskDueTime,
      reminder: taskReminder ? 1 : 0,
      status: taskStatus
    };

    try {
      if (editId) {
        await api.tasks.updateTask(editId, payload);
      } else {
        await api.tasks.createTask(payload);
      }
      setShowModal(false);
      Swal.fire({ title: 'Task Synchronized!', text: 'Your workspace has been updated.', icon: 'success', timer: 1500 });
      loadData();
    } catch (err) {
      Swal.fire('Error Saving Task', err.response?.data?.error || 'Database error.', 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    const prompt = await Swal.fire({
      title: 'Are you sure?',
      text: 'This removes the task from your database permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Yes, Delete'
    });

    if (prompt.isConfirmed) {
      try {
        await api.tasks.deleteTask(id);
        Swal.fire({ title: 'Deleted!', text: 'Task deleted successfully.', icon: 'info', timer: 1500 });
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const isCompleted = task.status === 'Completed';
      let nextStatus = 'Completed';
      if (isCompleted) {
        const todayStr = new Date().toISOString().split('T')[0];
        nextStatus = task.due_date < todayStr ? 'Overdue' : 'Pending';
      }

      await api.tasks.updateTask(task.id, {
        ...task,
        status: nextStatus
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const upcomingDeadlines = recentTasks.filter(t => t.status !== 'Completed').slice(0, 4);

  const chartData = {
    labels: stats.weeklyTrend.map(t => t.label),
    datasets: [{
      label: 'Tasks Completed',
      data: stats.weeklyTrend.map(t => t.completions),
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.04)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome back, {user?.name}! 👋</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Here is a snapshot of your workspace productivity quotients today.</p>
        </div>
        <button 
          onClick={handleOpenAddModal} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/10 transition btn-hover-lift"
        >
          <FiPlus /> Quick Task
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300 text-lg">
            <FiFolder />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending</span>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pending}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-300 text-lg">
            <FiClock />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</span>
            <h3 className="text-2xl font-extrabold text-green-600 mt-1">{stats.completed}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-300 text-lg">
            <FiCheckCircle />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overdue</span>
            <h3 className="text-2xl font-extrabold text-red-600 mt-1">{stats.overdue}</h3>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-300 text-lg ${stats.overdue > 0 ? 'badge-pulse' : ''}`}>
            <FiAlertCircle />
          </div>
        </div>
      </div>

      {/* Graphs & Deadlines Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Line Plot */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><FiTrendingUp className="text-blue-500 text-base" /> Workspace Weekly Completions</h3>
          </div>
          <div className="h-64 relative">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Deadlines Side Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Upcoming Deadlines</h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-64 pr-2">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-[11px]">All clear! No active deadlines.</div>
            ) : (
              upcomingDeadlines.map(t => {
                const isOverdue = t.status === 'Overdue';
                return (
                  <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/30 flex items-center justify-between">
                    <div className="max-w-[70%]">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{t.title}</h4>
                      <span className="text-[10px] text-slate-400">{t.list_name} • {t.priority}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] block font-bold ${isOverdue ? "text-red-600 badge-pulse" : "text-slate-500"}`}>{t.due_date}</span>
                      <span className={`text-[9px] ${isOverdue ? "text-red-500 font-semibold" : "text-slate-400"}`}>{isOverdue ? "Overdue" : "Due Soon"}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Recent Checklist Focus */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent Focus Tasks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/50 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4 w-10">Done</th>
                <th class="py-3 px-4">Task Details</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Priority</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">No tasks created yet. Click "Quick Task" to begin!</td>
                </tr>
              ) : (
                recentTasks.map(t => {
                  const isCompleted = t.status === 'Completed';
                  const isOverdue = t.status === 'Overdue';

                  let badgeColor = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
                  if (t.priority === 'High') badgeColor = "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
                  else if (t.priority === 'Medium') badgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

                  return (
                    <tr key={t.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-4 px-4">
                        <div 
                          onClick={() => handleToggleTask(t)} 
                          className={`custom-checkbox ${isCompleted ? "checked" : ""}`}
                        >
                          <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </div>
                      </td>
                      <td className={`py-4 px-4 font-semibold ${isCompleted ? "task-title-completed" : "text-slate-800 dark:text-slate-200"}`}>
                        <div>{t.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-xs truncate">{t.description || "No description"}</div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.list_color }}></span>
                          <span>{t.list_name}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeColor}`}>{t.priority}</span></td>
                      <td className={`py-4 px-4 font-semibold ${isOverdue ? "text-red-600" : "text-slate-500"}`}>{t.due_date}</td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button onClick={() => handleOpenEditModal(t)} className="text-slate-400 hover:text-blue-600 transition"><FiEdit3 /></button>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-slate-400 hover:text-red-600 transition"><FiTrash2 /></button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TASK DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-6 glass-card transform scale-100 transition-transform duration-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{editId ? 'Modify Goal Task' : 'Add New Goal Task'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                  placeholder="e.g. Normalise database schema"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Task Description</label>
                <textarea 
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows="3" 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                  placeholder="Milestones, steps or notes..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    required 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Task Folder List</label>
                  <select 
                    value={taskListId}
                    onChange={(e) => setTaskListId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {activeLists.map(list => (
                      <option key={list.id} value={list.id}>{list.list_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Priority</label>
                  <select 
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Status</label>
                  <select 
                    value={taskStatus}
                    disabled={!editId}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div className="flex items-center pt-5 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    <input 
                      type="checkbox" 
                      checked={taskReminder}
                      onChange={(e) => setTaskReminder(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                    />
                    <span>Reminder Alert</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-700/50 pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/10 transition"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default DashboardPage;
