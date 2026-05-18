import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { FiPieChart, FiTrendingUp, FiActivity, FiCheckCircle } from 'react-icons/fi';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement
);

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await api.analytics.getAnalytics();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  // Fallback if data structure is empty
  const folderShares = stats?.folderShares || [];
  const totalSharesCount = folderShares.reduce((sum, f) => sum + (f.count || 0), 0);

  // Line Chart Config
  const lineData = {
    labels: stats?.weeklyTrend?.map(t => t.label) || [],
    datasets: [{
      label: 'Tasks Completed',
      data: stats?.weeklyTrend?.map(t => t.completions) || [],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.04)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5
    }]
  };

  // Doughnut Chart Config (Folder Weight Distributions)
  const doughnutData = {
    labels: folderShares.length > 0 ? folderShares.map(f => f.list_name) : ['General'],
    datasets: [{
      data: folderShares.length > 0 ? folderShares.map(f => f.count) : [0],
      backgroundColor: folderShares.length > 0 ? folderShares.map(f => f.color || '#2563EB') : ['#E2E8F0'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Outfit', size: 11 } } }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Productivity Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review completion rates, folder sharing weight parameters, and history metrics.</p>
      </div>

      {/* Main Grid: Quotient Gauge + Doughnut Folder Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Completion Quotient Gauge */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-between text-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Completions Quotient</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center mt-4">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="64" stroke="#F1F5F9" strokeWidth="10" fill="transparent" className="dark:stroke-slate-700" />
              <circle cx="80" cy="80" r="64" stroke="#2563EB" strokeWidth="10" fill="transparent" 
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * (stats?.score || 0)) / 100}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{stats?.score}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Efficiency</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 max-w-[200px]">You have crushed <strong>{stats?.completed}</strong> tasks out of <strong>{stats?.total}</strong> total items recorded.</p>
        </div>

        {/* Folder Weight Distributions */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm md:col-span-2 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FiPieChart /> Folder Weight shares</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="h-44 relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-44 pr-2">
              {folderShares.length === 0 ? (
                <div className="text-[11px] text-slate-400">Seed tasks under custom folders to review share weights.</div>
              ) : (
                folderShares.map(folder => {
                  const sharePercentage = totalSharesCount > 0 ? Math.round((folder.count / totalSharesCount) * 100) : 0;
                  return (
                    <div key={folder.id} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }}></span>
                        <span>{folder.list_name}</span>
                      </span>
                      <span className="font-bold text-slate-500">{folder.count} completed ({sharePercentage}%)</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Completion Trends Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FiTrendingUp /> Daily Completed Indices</h3>
        <div className="h-72 relative">
          <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

    </div>
  )
}

export default AnalyticsPage;
