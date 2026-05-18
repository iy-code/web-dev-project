import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiCheckSquare, FiCalendar, FiPieChart, FiSettings, 
  FiLogOut, FiMenu, FiBell, FiSun, FiMoon, FiSearch 
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../services/api';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hasOverdue, setHasOverdue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Dark Mode Sync
  useEffect(() => {
    const isDark = localStorage.getItem('smart_tasks_dark') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDark = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('smart_tasks_dark', nextDark ? 'true' : 'false');
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Scan overdue count for bell notification pings
  useEffect(() => {
    const checkOverdue = async () => {
      try {
        const res = await api.tasks.getTasks({ status: 'Overdue' });
        setHasOverdue(res.data.length > 0);
      } catch (err) {
        console.error('Overdue checking failed:', err.message);
      }
    };
    checkOverdue();
  }, [location]);

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    navigate(`/tasks?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleNotificationClick = async () => {
    try {
      const res = await api.analytics.getAnalytics();
      const data = res.data;
      if (data.overdue > 0 || data.pending > 0) {
        Swal.fire({
          title: 'Workspace Briefing',
          html: `<div class="text-left text-xs space-y-2 mt-2">
                    <p class="text-red-600 font-bold"><i class="fa-solid fa-circle-exclamation mr-1"></i> ${data.overdue} tasks are OVERDUE.</p>
                    <p class="text-yellow-600 font-bold"><i class="fa-regular fa-clock mr-1"></i> ${data.pending} tasks are pending focus.</p>
                 </div>`,
          icon: 'info',
          confirmButtonColor: '#2563EB',
          confirmButtonText: 'Let\'s Crush It!'
        });
      } else {
        Swal.fire({
          title: 'All Clear!',
          text: 'Superb! You have no outstanding deadlines.',
          icon: 'success',
          confirmButtonColor: '#16A34A'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2) : 'US';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiPieChart },
    { name: 'My Tasks', path: '/tasks', icon: FiCheckSquare },
    { name: 'Calendar', path: '/calendar', icon: FiCalendar },
    { name: 'Analytics', path: '/analytics', icon: FiPieChart },
    { name: 'Settings', path: '/settings', icon: FiSettings }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* SIDEBAR CONTAINER */}
      <aside className={`bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700/50 flex flex-col z-20 transition-all duration-300 ${collapsed ? 'w-0 overflow-hidden' : 'w-64'}`}>
        
        {/* Header Branding */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/10">ST</div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">Smart Tasks</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Workspace</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${isActive ? 'text-blue-600 bg-blue-50 dark:bg-slate-700/50 dark:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/30 dark:hover:text-white'}`}
              >
                <Icon className="text-base w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-slate-50 dark:border-slate-700/50 space-y-2">
          <button 
            onClick={toggleDark} 
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl"
          >
            <span className="flex items-center gap-2">
              {darkMode ? <FiSun className="text-sm" /> : <FiMoon className="text-sm" />}
              <span>Dark Theme</span>
            </span>
            <div className={`w-8 h-4 rounded-full relative flex items-center px-0.5 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>
          
          <button 
            onClick={logout} 
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-left"
          >
            <FiLogOut className="text-sm" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN BODY WRAPPER */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAVBAR HEADER */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg"
            >
              <FiMenu className="text-lg" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearch} className="relative w-72 max-w-xs hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <FiSearch className="text-sm" />
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition" 
                placeholder="Search tasks globally..."
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell alerts */}
            <button 
              onClick={handleNotificationClick} 
              className="relative p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg"
            >
              <FiBell className="text-lg" />
              {hasOverdue && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full badge-pulse"></span>
              )}
            </button>

            {/* Account Details Avatar */}
            <div className="flex items-center gap-3 border-l border-slate-100 dark:border-slate-700 pl-4">
              <div className="text-right hidden md:block">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user?.name || 'Workspace User'}</h4>
                <span className="text-[10px] text-slate-400 font-semibold">{user?.email || 'user@smarttasks.com'}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-md shadow-blue-500/10">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* OUTLET VIEWPORT MOUNTS */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>

    </div>
  )
}

export default DashboardLayout;
