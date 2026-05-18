import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiCheckSquare, FiCalendar, FiPieChart, FiTrendingUp, 
  FiFolder, FiShield, FiArrowRight 
} from 'react-icons/fi';

const LandingPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const features = [
    { title: 'Google Tasks Visual Flow', desc: 'Crush tasks with dynamic strike-throughs, priority tags, and clean checklists.', icon: FiCheckSquare, color: 'text-blue-500' },
    { title: 'FullCalendar Month Grid', desc: 'Direct drag-and-drop scheduling, day views, and calendar syncs.', icon: FiCalendar, color: 'text-green-500' },
    { title: 'Productivity Index Analytics', desc: 'Chart completion trend lines, categories polar sharing, and performance gauges.', icon: FiPieChart, color: 'text-amber-500' },
    { title: 'Relational List Folders', desc: 'Organize files under custom color-coded category folders.', icon: FiFolder, color: 'text-purple-500' },
    { title: 'Performance Metrics Logs', desc: 'Tally historical task counts, overdue warnings, and user activity history.', icon: FiTrendingUp, color: 'text-pink-500' },
    { title: 'Production JWT Security', desc: 'Protected API routings, secure bcrypt password hashing, and session locks.', icon: FiShield, color: 'text-indigo-500' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-x-hidden">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-blue-500/20">ST</div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white uppercase">Smart Tasks</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">Sign In</Link>
          <Link to="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/15 btn-hover-lift">Get Started</Link>
        </div>
      </header>

      {/* Hero Banner Grid */}
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-8 max-w-7xl mx-auto w-full">
        <motion.div 
          className="text-center max-w-3xl space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span 
            className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-blue-100 dark:border-blue-900/30"
            variants={itemVariants}
          >
            ⚡ Next-Gen Tasks Management
          </motion.span>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none"
            variants={itemVariants}
          >
            Organize work and <br />
            <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">maximize flows.</span>
          </motion.h1>

          <motion.p 
            className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium leading-relaxed"
            variants={itemVariants}
          >
            Inspired by Google Tasks and Todoist. Build Relational folders, schedule interactively, and view dynamic completions statistics under a secure JWT workspace.
          </motion.p>

          <motion.div 
            className="flex items-center justify-center gap-4 pt-4"
            variants={itemVariants}
          >
            <Link to="/register" className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xl shadow-blue-500/10 transition btn-hover-lift flex items-center gap-2">
              Start Workspace <FiArrowRight />
            </Link>
            <Link to="/login" className="px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition">
              Explore Demo login
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Grid cards */}
        <motion.section 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-24 w-full"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div 
                key={idx}
                className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200"
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <div className={`h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-xl mb-6 shadow-inner ${feat.color}`}>
                  <Icon />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-8 md:px-16 text-xs text-slate-400 font-semibold">
        <span>&copy; 2026 Smart Tasks Workspace.</span>
        <span>DBMS Relational MySQL Project.</span>
      </footer>

    </div>
  )
}

export default LandingPage;
