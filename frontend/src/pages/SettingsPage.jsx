import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiActivity, FiKey, FiCpu, FiTrash } from 'react-icons/fi';
import Swal from 'sweetalert2';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const res = await api.auth.profile();
      setProfileData(res.data);
    } catch (err) {
      console.error('Failed to load profile details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleResetWorkspace = async () => {
    Swal.fire({
      title: 'Reset Workspace?',
      html: `<p class="text-xs text-slate-500">This deletes all task records, lists folders, and activity transactions in your database under this user account.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Yes, Wipe Database'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Fetch tasks to loop and delete
          const tasksRes = await api.tasks.getTasks();
          const delPromises = tasksRes.data.map(t => api.tasks.deleteTask(t.id));
          await Promise.all(delPromises);
          
          Swal.fire({ title: 'Workspace Wiped!', text: 'Workspace has been reset.', icon: 'info', timer: 1500 });
          loadProfile();
        } catch (err) {
          Swal.fire('Reset Failed', 'Error wiping records.', 'error');
        }
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

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2) : 'US';

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review active profile properties, audit trail logs, and system controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Identity Widget */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold uppercase shadow-lg shadow-blue-500/10 mb-4">
              {initials}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</h3>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider mt-1">Workspace Manager</span>
            
            <div className="border-t border-slate-50 dark:border-slate-700/30 w-full mt-6 pt-4 space-y-3 text-left">
              <div className="flex items-center gap-3 text-xs">
                <FiUser className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-semibold">{user?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <FiMail className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-semibold truncate">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* System Control Widget */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2"><FiCpu /> System Controls</h3>
            <div className="space-y-3">
              <button 
                onClick={handleResetWorkspace}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition"
              >
                <span>Reset All Tasks</span>
                <FiTrash />
              </button>
              
              <button 
                onClick={logout}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition"
              >
                <span>Log Out Session</span>
              </button>
            </div>
          </div>

        </div>

        {/* Workspace Activity Auditing Logs Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2"><FiActivity className="text-blue-500" /> Workspace Activity Feed</h3>
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px] pr-2">
            {profileData?.activityHistory?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">No system transactions logged. Perform changes to generate logs!</div>
            ) : (
              profileData?.activityHistory?.map((log, index) => {
                const date = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const fullDate = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                return (
                  <div key={index} className="flex items-start gap-4 text-xs border-l-2 border-blue-100 dark:border-slate-700 pl-4 relative py-1">
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 -left-[6px] top-2 shadow"></div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{log.action}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{fullDate} • {date}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

    </div>
  )
}

export default SettingsPage;
