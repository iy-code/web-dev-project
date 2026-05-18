import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';
import Swal from 'sweetalert2';
import { FiCalendar, FiPlus } from 'react-icons/fi';

const CalendarPage = () => {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Task Dialog Fields
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskListId, setTaskListId] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('00:00:00');
  const [taskReminder, setTaskReminder] = useState(false);

  const loadData = async () => {
    try {
      const [resTasks, resLists] = await Promise.all([
        api.tasks.getTasks(),
        api.lists.getLists()
      ]);
      setTasks(resTasks.data);
      setLists(resLists.data);
      if (resLists.data.length > 0) {
        setTaskListId(resLists.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load calendar events:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map tasks to FullCalendar event schema
  const events = tasks.map(t => {
    let color = '#2563EB'; // Pending blue
    if (t.status === 'Completed') color = '#16A34A'; // Green
    else if (t.status === 'Overdue') color = '#DC2626'; // Red
    else if (t.priority === 'High') color = '#EA580C'; // Orange
    else if (t.priority === 'Low') color = '#64748B'; // Slate

    return {
      id: t.id,
      title: t.title,
      start: t.due_date,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        description: t.description,
        list_name: t.list_name,
        priority: t.priority,
        status: t.status,
        due_time: t.due_time,
        list_id: t.list_id,
        reminder: t.reminder
      }
    };
  });

  const handleDateClick = (info) => {
    setTaskTitle('');
    setTaskDesc('');
    if (lists.length > 0) setTaskListId(lists[0].id);
    setTaskPriority('Medium');
    setTaskDueDate(info.dateStr);
    setTaskDueTime('00:00:00');
    setTaskReminder(false);
    setShowModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskListId || !taskDueDate) return;

    try {
      await api.tasks.createTask({
        title: taskTitle,
        description: taskDesc,
        list_id: taskListId,
        priority: taskPriority,
        due_date: taskDueDate,
        due_time: taskDueTime,
        reminder: taskReminder ? 1 : 0
      });
      setShowModal(false);
      Swal.fire({ title: 'Scheduled!', text: 'Task mapped to calendar.', icon: 'success', timer: 1500 });
      loadData();
    } catch (err) {
      Swal.fire('Scheduling Failed', err.response?.data?.error || 'Database error.', 'error');
    }
  };

  const handleEventClick = (info) => {
    const props = info.event.extendedProps;
    Swal.fire({
      title: info.event.title,
      html: `<div class="text-left text-xs space-y-2 mt-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p><strong>Folder:</strong> ${props.list_name}</p>
                <p><strong>Priority:</strong> ${props.priority}</p>
                <p><strong>Status:</strong> ${props.status}</p>
                <p><strong>Due Time:</strong> ${props.due_time !== '00:00:00' ? props.due_time.substring(0,5) : 'Anytime'}</p>
                <p><strong>Details:</strong> ${props.description || 'No milestones specified.'}</p>
             </div>`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#DC2626',
      confirmButtonText: 'Edit in My Tasks',
      cancelButtonText: 'Close'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(`/tasks`);
      }
    });
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Calendar Planner</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Directly schedule, coordinate, and review tasks across visual monthly grids.</p>
        </div>
        <button 
          onClick={() => handleDateClick({ dateStr: new Date().toISOString().split('T')[0] })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/10 transition btn-hover-lift"
        >
          <FiPlus /> Schedule Task
        </button>
      </div>

      {/* Calendar Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height={550}
          editable={false}
          selectable={true}
        />
      </div>

      {/* QUICK SCHEDULE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-45 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-6 glass-card transform scale-100 transition-transform duration-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Schedule Task for {taskDueDate}</h3>
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
                  placeholder="e.g. Prepare presentation deck"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Description</label>
                <textarea 
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows="2" 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                  placeholder="Brief notes..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Due Time</label>
                  <input 
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
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
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default CalendarPage;
