import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial check on mount
    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('smart_tasks_token');
            if (token) {
                try {
                    const res = await api.auth.profile();
                    setUser(res.data.user);
                } catch (err) {
                    console.error('Session verification expired:', err.message);
                    localStorage.removeItem('smart_tasks_token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        verifySession();
    }, []);

    // Login Action
    const login = async (email, password) => {
        try {
            const res = await api.auth.login(email, password);
            const { token, ...userData } = res.data.user;
            
            localStorage.setItem('smart_tasks_token', token);
            setUser(userData);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.error || 'Authentication failed.';
            return { success: false, error: message };
        }
    };

    // Register Action
    const register = async (name, email, password) => {
        try {
            const res = await api.auth.register(name, email, password);
            const { token, ...userData } = res.data.user;
            
            localStorage.setItem('smart_tasks_token', token);
            setUser(userData);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.error || 'Registration failed.';
            return { success: false, error: message };
        }
    };

    // Logout Action
    const logout = () => {
        localStorage.removeItem('smart_tasks_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be invoked within an AuthProvider scope.');
    }
    return context;
};
