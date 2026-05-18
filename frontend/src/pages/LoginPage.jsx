import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock } from 'react-icons/fi';
import Swal from 'sweetalert2';

const LoginPage = () => {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return Swal.fire('Missing Details', 'Please fill in both email and password.', 'warning');
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      Swal.fire({
        title: 'Welcome Back!',
        text: 'Session established successfully.',
        icon: 'success',
        confirmButtonColor: '#2563EB',
        timer: 1500
      });
      navigate('/dashboard');
    } else {
      Swal.fire('Login Failed', result.error, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 overflow-hidden">
      
      <motion.div 
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-8 glass-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/20 mb-3 hover:scale-105 transition-transform duration-200">
            ST
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">Smart Tasks Login</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Access your secure task coordination workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <FiMail />
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs dark:text-white transition" 
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <FiLock />
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs dark:text-white transition" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white rounded-xl font-bold text-xs transition btn-hover-lift shadow-lg shadow-blue-500/10 flex items-center justify-center"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>

          <div className="text-center mt-4">
            <p class="text-xs text-slate-500 dark:text-slate-400">Don't have an account? <Link to="/register" className="text-blue-600 hover:underline font-bold transition">Create Account</Link></p>
          </div>
        </form>
      </motion.div>

    </div>
  )
}

export default LoginPage;
