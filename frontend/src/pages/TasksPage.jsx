import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { 
  FiPlus, FiSearch, FiFilter, FiFolder, FiTrash2, 
  FiEdit, FiClock, FiCheckSquare, FiAlertCircle 
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Location Query Sync (For Top Bar Global Search redirects)
  const location = useLocation();

  // Task Dialog Fields
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskListId, setTaskListId] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('00:00:00');
  const [taskReminder, setTaskReminder] = useState(false);
  const [taskStatus, setTaskStatus] = useState('Pending');

  // List Dialog Fields
  const [showListModal, setShowListModal] = useState(false);
  const [listName, setListName] = useState('');
  const [listColor, setListColor] = useState('#2563EB');

  const loadWorkspace = async () => {
    try {
      const resLists = await api.lists.getLists();
      setLists(resLists.data);

      // Extract search from URL query if redirected
      const params = new URLSearchParams(location.search);
      const urlSearch = params.get('search') || '';
      if (urlSearch) setSearchQuery(urlSearch);

      const filters = {
        search: urlSearch || searchQuery,
        list_id: selectedListId,
        priority: filterPriority,
        status: filterStatus
      };

      const resTasks = await api.tasks.getTasks(filters);
      setTasks(resTasks.data);
    } catch (err) {
      console.error('Failed to load workspace data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [selectedListId, filterPriority, filterStatus, location.search]);

  const handleSearchTrigger = async () => {
    try {
      const filters = {
        search: searchQuery,
        list_id: selectedListId,
        priority: filterPriority,
        status: filterStatus
      };
      const res = await api.tasks.getTasks(filters);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Task CRUD operations
  const handleOpenAddModal = () => {
    setEditTaskId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskListId(selectedListId || (lists.length > 0 ? lists[0].id : ''));
    setTaskPriority('Medium');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskDueTime('00:00:00');
    setTaskReminder(false);
    setTaskStatus('Pending');
    setShowTaskModal(true);
  };

  const handleOpenEditModal = (t) => {
    setEditTaskId(t.id);
    setTaskTitle(t.title);
    setTaskDesc(t.description || '');
    setTaskListId(t.list_id);
    setTaskPriority(t.priority);
    setTaskDueDate(t.due_date);
    setTaskDueTime(t.due_time || '00:00:00');
    setTaskReminder(t.reminder === 1);
    setTaskStatus(t.status);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskListId || !taskDueDate) {
      return Swal.fire('Missing Info', 'Complete the title, list folder, and due date.', 'warning');
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
      if (editTaskId) {
        await api.tasks.updateTask(editTaskId, payload);
      } else {
        await api.tasks.createTask(payload);
      }
      setShowTaskModal(false);
      Swal.fire({ title: 'Task Saved!', text: 'Workspace successfully updated.', icon: 'success', timer: 1500 });
      loadWorkspace();
    } catch (err) {
      Swal.fire('Save Failed', err.response?.data?.error || 'Database error.', 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    const prompt = await Swal.fire({
      title: 'Are you sure?',
      text: 'Permanently deletes this task from database.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Yes, Delete'
    });

    if (prompt.isConfirmed) {
      try {
        await api.tasks.deleteTask(id);
        Swal.fire({ title: 'Deleted!', text: 'Task deleted.', icon: 'info', timer: 1200 });
        loadWorkspace();
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
      loadWorkspace();
    } catch (err) {
      console.error(err);
    }
  };

  // Category Folder Lists Operations
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!listName || listName.trim() === '') {
      return Swal.fire('Folder Name Required', 'Please enter a valid list name.', 'warning');
    }

    try {
      const res = await api.lists.createList(listName, listColor);
      setShowListModal(false);
      setListName('');
      setListColor('#2563EB');
      Swal.fire({ title: 'List Created!', text: 'Added new relational category folder.', icon: 'success', timer: 1500 });
      loadWorkspace();
      setSelectedListId(res.data.id);
    } catch (err) {
      Swal.fire('Folder Creation Failed', err.response?.data?.error || 'Error.', 'error');
    }
  };

  const handleDeleteList = async (id, name) => {
    const prompt = await Swal.fire({
      title: 'Delete Category Folder?',
      html: `<div class="text-xs text-slate-500 mt-2">Deleting folder <strong>"${name}"</strong> will cascades and permanently delete all tasks associated with it!</div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Yes, Delete Folder'
    });

    if (prompt.isConfirmed) {
      try {
        await api.lists.deleteList(id);
        Swal.fire({ title: 'Folder Removed', text: 'Category deleted.', icon: 'info', timer: 1500 });
        setSelectedListId('');
        loadWorkspace();
      } catch (err) {
        Swal.fire('Delete Blocked', err.response?.data?.error || 'Database error.', 'error');
      }
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Workspace Tasks</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Organize, schedule, and refine your checklist coordinates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowListModal(true)} 
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 transition hover:bg-slate-50"
          >
            <FiFolder /> New Folder
          </button>
          <button 
            onClick={handleOpenAddModal} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/10 transition btn-hover-lift"
          >
            <FiPlus /> New Task
          </button>
        </div>
      </div>

      {/* List Folders horizontal scrolling selector chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pr-2">
        <button 
          onClick={() => setSelectedListId('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${selectedListId === '' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
        >
          All Lists
        </button>
        {lists.map(list => {
          const isActive = selectedListId == list.id;
          return (
            <div key={list.id} className="flex items-center gap-1.5 whitespace-nowrap">
              <button 
                onClick={() => setSelectedListId(list.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: list.color }}></span>
                <span>{list.list_name}</span>
              </button>
              {isActive && (
                <button 
                  onClick={() => handleDeleteList(list.id, list.list_name)} 
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs transition"
                  title="Delete this folder list"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Dynamic Filters panel */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
        <div className="relative md:col-span-2 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <FiSearch />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
              placeholder="Search tasks title, desc..."
            />
          </div>
          <button 
            onClick={handleSearchTrigger} 
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
          >
            Find
          </button>
        </div>
        
        <div>
          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div className="text-right">
          <button 
            onClick={() => {
              setSearchQuery('');
              setFilterPriority('');
              setFilterStatus('');
              setSelectedListId('');
            }}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Task Cards Grid */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-2xl">
            <FiCheckSquare />
          </div>
          <div className="max-w-xs">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">No tasks found</h3>
            <p className="text-xs text-slate-500 mt-1">Adjust your parameters, or click "New Task" to seed items.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(t => {
            const isCompleted = t.status === 'Completed';
            const isOverdue = t.status === 'Overdue';

            let badgeColor = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
            if (t.priority === 'High') badgeColor = "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
            else if (t.priority === 'Medium') badgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

            return (
              <div key={t.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${badgeColor}`}>{t.priority} Priority</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.list_color }}></span>
                      <span>{t.list_name}</span>
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-start gap-3">
                    <div 
                      onClick={() => handleToggleTask(t)} 
                      className={`custom-checkbox mt-0.5 ${isCompleted ? "checked" : ""}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xs font-bold leading-tight ${isCompleted ? "task-title-completed" : "text-slate-800 dark:text-slate-100"}`}>{t.title}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">{t.description || "No description provided."}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-50 dark:border-slate-700/30 mt-6 pt-4 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-bold badge-pulse" : "text-slate-400"}`}>
                    <FiClock /> Due {t.due_date} {t.due_time !== '00:00:00' ? `@ ${t.due_time.substring(0,5)}` : ''}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleOpenEditModal(t)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition"><FiEdit /></button>
                    <button onClick={() => handleDeleteTask(t.id)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition"><FiTrash2 /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-45 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-6 glass-card transform scale-100 transition-transform duration-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{editTaskId ? 'Modify Goal Task' : 'Add New Goal Task'}</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
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
                    {lists.map(list => (
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
                    disabled={!editTaskId}
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
                  onClick={() => setShowTaskModal(false)} 
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

      {/* NEW FOLDER MODAL */}
      {showListModal && (
        <div className="fixed inset-0 z-45 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-6 glass-card transform scale-100 transition-transform duration-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Category Folder</h3>
              <button onClick={() => setShowListModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Folder Name</label>
                <input 
                  type="text" 
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  required 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                  placeholder="e.g. Fitness Routine"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Color Code Tag</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={listColor}
                    onChange={(e) => setListColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{listColor}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-700/50 pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowListModal(false)} 
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/10 transition"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default TasksPage;
