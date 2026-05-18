import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Auto Inject JWT token on requests
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('smart_tasks_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Unified endpoint handlers
const apiServices = {
    // Auth endpoints
    auth: {
        register: (name, email, password) => API.post('/auth/register', { name, email, password }),
        login: (email, password) => API.post('/auth/login', { email, password }),
        profile: () => API.get('/auth/profile')
    },
    // Tasks CRUD
    tasks: {
        getTasks: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.list_id) params.append('list_id', filters.list_id);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.status) params.append('status', filters.status);
            return API.get(`/tasks?${params.toString()}`);
        },
        createTask: (taskData) => API.post('/tasks', taskData),
        updateTask: (id, taskData) => API.put(`/tasks/${id}`, taskData),
        deleteTask: (id) => API.delete(`/tasks/${id}`)
    },
    // Folder Lists CRUD
    lists: {
        getLists: () => API.get('/lists'),
        createList: (list_name, color) => API.post('/lists', { list_name, color }),
        updateList: (id, list_name, color) => API.put(`/lists/${id}`, { list_name, color }),
        deleteList: (id) => API.delete(`/lists/${id}`)
    },
    // Analytics Metrics
    analytics: {
        getAnalytics: () => API.get('/analytics')
    }
};

export default apiServices;
