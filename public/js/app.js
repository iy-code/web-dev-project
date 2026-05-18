// SmartFlow Task Manager - Client SPA Javascript Engine
let currentUser = null;
let charts = {}; // Holds Chart.js instances to prevent memory leak duplicates
let calendarInstance = null; // FullCalendar instance

document.addEventListener('DOMContentLoaded', () => {
    // 1. Enforce Session Checks
    checkSession();

    // 2. Bind Auth Forms
    document.getElementById('login-form').addEventListener('submit', login);
    document.getElementById('register-form').addEventListener('submit', register);
    document.getElementById('task-form').addEventListener('submit', saveTask);
    document.getElementById('profile-form').addEventListener('submit', updateProfile);

    // 3. Dark Mode Initial Sync
    const isDark = localStorage.getItem('smartflow_dark') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
        const ball = document.getElementById('theme-ball');
        if (ball) ball.style.transform = 'translateX(16px)';
    }
});

// ==========================================
// 1. SESSION & AUTHENTICATION HANDLERS
// ==========================================
async function checkSession() {
    try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        
        if (data.loggedIn) {
            currentUser = data.user;
            showWorkspace();
        } else {
            showAuth();
        }
    } catch (err) {
        console.error('Session check failed:', err);
        showAuth();
    }
}

function showWorkspace() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    
    // Update User Display Widget
    document.getElementById('user-display-name').innerText = currentUser.name;
    document.getElementById('user-display-email').innerText = currentUser.email;
    
    // Generate Avatar Initials
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    document.getElementById('user-display-initials').innerText = initials || 'U';

    switchView('dashboard');
}

function showAuth() {
    document.getElementById('app-view').classList.add('hidden');
    document.getElementById('auth-view').classList.remove('hidden');
    toggleAuthForm(false);
}

function toggleAuthForm(isRegister) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const subtitle = document.getElementById('auth-subtitle');

    if (isRegister) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        subtitle.innerText = 'Boost your weekly productivity flows.';
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        subtitle.innerText = 'Sign in to coordinate your tasks.';
    }
}

async function login(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            currentUser = data.user;
            Swal.fire({
                title: 'Welcome Back!',
                text: `Session established successfully. Welcome ${currentUser.name}!`,
                icon: 'success',
                confirmButtonColor: '#2563EB',
                timer: 2000,
                timerProgressBar: true
            });
            showWorkspace();
        } else {
            Swal.fire('Login Failed', data.error, 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Unable to reach the server.', 'error');
    }
}

async function register(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (password !== confirm) {
        return Swal.fire('Mismatch', 'Confirm password does not match.', 'warning');
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            currentUser = data.user;
            Swal.fire({
                title: 'Account Created!',
                text: 'Your productivity workspace is ready.',
                icon: 'success',
                confirmButtonColor: '#16A34A',
                timer: 2000
            });
            showWorkspace();
        } else {
            Swal.fire('Registration Failed', data.error, 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Unable to reach the server.', 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        showAuth();
        Swal.fire({
            title: 'Logged Out',
            text: 'You have signed out successfully.',
            icon: 'info',
            confirmButtonColor: '#2563EB',
            timer: 1500
        });
    } catch (err) {
        console.error('Logout failed:', err);
    }
}

// ==========================================
// 2. VIEW CONTROLLER (SPA NAVIGATION)
// ==========================================
function switchView(viewName) {
    const views = ['dashboard', 'tasks', 'calendar', 'analytics', 'profile'];
    
    // Hide all view elements
    views.forEach(v => {
        const el = document.getElementById(`${v}-view`);
        const navBtn = document.getElementById(`nav-${v}`);
        if (el) el.classList.add('hidden');
        
        // Reset sidebar button active class styling
        if (navBtn) {
            navBtn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition sidebar-link text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/30 dark:hover:text-white";
        }
    });

    // Show selected view
    const activeEl = document.getElementById(`${viewName}-view`);
    if (activeEl) activeEl.classList.remove('hidden');

    // Highlight Active Nav Button
    const activeNav = document.getElementById(`nav-${viewName}`);
    if (activeNav) {
        activeNav.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition sidebar-link text-blue-600 bg-blue-50 dark:bg-slate-700/50 dark:text-white";
    }

    // Refresh view data dynamically
    if (viewName === 'dashboard') {
        loadDashboard();
    } else if (viewName === 'tasks') {
        loadTasks();
    } else if (viewName === 'calendar') {
        loadCalendar();
    } else if (viewName === 'analytics') {
        loadAnalytics();
    } else if (viewName === 'profile') {
        loadProfile();
    }
}

// Global search bar trigger
function triggerGlobalSearch(query) {
    // Redirect focus to My Tasks viewport
    const views = ['dashboard', 'calendar', 'analytics', 'profile'];
    views.forEach(v => {
        const el = document.getElementById(`${v}-view`);
        if (el) el.classList.add('hidden');
        const btn = document.getElementById(`nav-${v}`);
        if (btn) btn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition sidebar-link text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/30 dark:hover:text-white";
    });

    document.getElementById('tasks-view').classList.remove('hidden');
    document.getElementById('nav-tasks').className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition sidebar-link text-blue-600 bg-blue-50 dark:bg-slate-700/50 dark:text-white";

    // Set filter query in tasks panel and refresh
    document.getElementById('filter-search').value = query;
    loadTasks();
}

// Toggle Sidebar Collapse
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('w-64');
    sidebar.classList.toggle('w-0');
    sidebar.classList.toggle('overflow-hidden');
}

// Dark Mode Toggle
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('smartflow_dark', isDark ? 'true' : 'false');
    const ball = document.getElementById('theme-ball');
    if (ball) {
        ball.style.transform = isDark ? 'translateX(16px)' : 'translateX(0px)';
    }
}

// ==========================================
// 3. DASHBOARD LOGIC
// ==========================================
async function loadDashboard() {
    try {
        // Fetch stats metrics
        const resStats = await fetch('/api/analytics');
        const stats = await resStats.json();

        document.getElementById('stat-total').innerText = stats.total;
        document.getElementById('stat-pending').innerText = stats.pending;
        document.getElementById('stat-completed').innerText = stats.completed;
        document.getElementById('stat-overdue').innerText = stats.overdue;

        // Pulse warning if overdue count is high
        const box = document.getElementById('stat-overdue-box');
        if (stats.overdue > 0) {
            box.classList.add('badge-pulse');
        } else {
            box.classList.remove('badge-pulse');
        }

        // Load deadlines
        const resTasks = await fetch('/api/tasks');
        const tasks = await resTasks.json();

        // Overdue count synchronization
        const overdueTasks = tasks.filter(t => t.status === 'Overdue');
        const notifPing = document.getElementById('notif-ping');
        if (overdueTasks.length > 0) {
            notifPing.classList.remove('hidden');
        } else {
            notifPing.classList.add('hidden');
        }

        // Render Upcomings (Limit to 4 active)
        const activeDeadlines = tasks.filter(t => t.status !== 'Completed').slice(0, 4);
        const deadlinesContainer = document.getElementById('dashboard-deadlines-container');
        deadlinesContainer.innerHTML = '';

        if (activeDeadlines.length === 0) {
            deadlinesContainer.innerHTML = `<div class="text-center py-8 text-slate-400 text-[11px]">All clear! No active deadlines.</div>`;
        } else {
            activeDeadlines.forEach(t => {
                const isOverdue = t.status === 'Overdue';
                deadlinesContainer.innerHTML += `
                    <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/30 flex items-center justify-between">
                        <div class="max-w-[70%]">
                            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${t.title}</h4>
                            <span class="text-[10px] text-slate-400">${t.category} • ${t.priority}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] block font-bold ${isOverdue ? "text-red-600 badge-pulse" : "text-slate-500"}">${t.due_date}</span>
                            <span class="text-[9px] ${isOverdue ? "text-red-500 font-semibold" : "text-slate-400"}">${isOverdue ? "Overdue" : "Due Soon"}</span>
                        </div>
                    </div>
                `;
            });
        }

        // Render Recent Tasks table (Max 5)
        const recentTasks = tasks.slice(0, 5);
        const tbody = document.getElementById('recent-tasks-tbody');
        tbody.innerHTML = '';

        if (recentTasks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">No tasks created yet. Click "Quick Task" to begin!</td></tr>`;
        } else {
            recentTasks.forEach(t => {
                const isCompleted = t.status === 'Completed';
                const isOverdue = t.status === 'Overdue';
                
                let badgeColor = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
                if (t.priority === 'High') badgeColor = "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
                else if (t.priority === 'Medium') badgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

                tbody.innerHTML += `
                    <tr class="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td class="py-4 px-4">
                            <div onclick="toggleTask(${t.id}, 'dashboard')" class="custom-checkbox ${isCompleted ? "checked" : ""}">
                                <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </div>
                        </td>
                        <td class="py-4 px-4 font-semibold ${isCompleted ? "task-title-completed" : "text-slate-800 dark:text-slate-200"}">
                            <div>${t.title}</div>
                            <div class="text-[10px] text-slate-400 font-normal mt-0.5 max-w-xs truncate">${t.description || "No description"}</div>
                        </td>
                        <td class="py-4 px-4 font-medium text-slate-500">${t.category}</td>
                        <td class="py-4 px-4"><span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeColor}">${t.priority}</span></td>
                        <td class="py-4 px-4 font-semibold ${isOverdue ? "text-red-600" : "text-slate-500"}">${t.due_date}</td>
                        <td class="py-4 px-4 text-right space-x-1.5">
                            <button onclick="openEditTaskModal(${t.id}, '${t.title.replace(/'/g, "\\'")}', '${(t.description || '').replace(/'/g, "\\'")}', '${t.due_date}', '${t.category}', '${t.priority}', '${t.status}')" class="text-slate-400 hover:text-blue-600"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button onclick="deleteTask(${t.id}, 'dashboard')" class="text-slate-400 hover:text-red-600"><i class="fa-regular fa-trash-can"></i></button>
                        </td>
                    </tr>
                `;
            });
        }

        // Render Dashboard Completion Trend Graph
        renderDashboardWeeklyChart(stats.weeklyTrend);

    } catch (err) {
        console.error('Failed to load dashboard data:', err);
    }
}

function renderDashboardWeeklyChart(trendData) {
    const ctx = document.getElementById('dashboardWeeklyChart').getContext('2d');
    
    // Destroy existing instance to prevent duplicates
    if (charts['dashboard']) {
        charts['dashboard'].destroy();
    }

    const labels = trendData.map(t => t.label);
    const dataset = trendData.map(t => t.completions);

    charts['dashboard'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks Completed',
                data: dataset,
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                fill: true,
                tension: 0.4,
                borderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

function showQuickAlerts() {
    fetch('/api/analytics')
        .then(res => res.json())
        .then(data => {
            if (data.overdue > 0 || data.pending > 0) {
                Swal.fire({
                    title: 'Workspace Briefing',
                    html: `<div class="text-left text-xs space-y-2 mt-2">
                                <p class="text-red-600 font-bold"><i class="fa-solid fa-circle-exclamation mr-1"></i> ${data.overdue} tasks are OVERDUE.</p>
                                <p class="text-yellow-600 font-bold"><i class="fa-regular fa-clock mr-1"></i> ${data.pending} tasks are pending focus.</p>
                           </div>`,
                    icon: 'info',
                    confirmButtonColor: '#2563EB',
                    confirmButtonText: 'Let\'s Go!'
                });
            } else {
                Swal.fire({
                    title: 'All Caught Up!',
                    text: 'Amazing! You have no pending deadlines today.',
                    icon: 'success',
                    confirmButtonColor: '#16A34A'
                });
            }
        });
}

// ==========================================
// 4. TASKS CRUD OPERATIONS
// ==========================================
async function loadTasks() {
    const search = document.getElementById('filter-search').value;
    const category = document.getElementById('filter-category').value;
    const priority = document.getElementById('filter-priority').value;
    const status = document.getElementById('filter-status').value;

    const url = `/api/tasks?search=${encodeURIComponent(search)}&category=${category}&priority=${priority}&status=${status}`;

    try {
        const res = await fetch(url);
        const tasks = await res.json();
        
        const grid = document.getElementById('tasks-grid');
        const emptyState = document.getElementById('tasks-empty-state');
        
        grid.innerHTML = '';

        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
            grid.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            grid.classList.remove('hidden');

            tasks.forEach(t => {
                const isCompleted = t.status === 'Completed';
                const isOverdue = t.status === 'Overdue';

                let badgeColor = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
                if (t.priority === 'High') badgeColor = "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
                else if (t.priority === 'Medium') badgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

                grid.innerHTML += `
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm task-card flex flex-col justify-between">
                        <div>
                            <!-- Header -->
                            <div class="flex items-start justify-between gap-3">
                                <span class="px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${badgeColor}">${t.priority} Priority</span>
                                <span class="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg">${t.category}</span>
                            </div>
                            <!-- Body -->
                            <div class="mt-4 flex items-start gap-3">
                                <div onclick="toggleTask(${t.id}, 'tasks')" class="custom-checkbox mt-0.5 ${isCompleted ? "checked" : ""}">
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-xs font-bold leading-tight ${isCompleted ? "task-title-completed" : "text-slate-800 dark:text-slate-100"}">${t.title}</h3>
                                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">${t.description || "No description provided."}</p>
                                </div>
                            </div>
                        </div>
                        <!-- Footer -->
                        <div class="border-t border-slate-50 dark:border-slate-700/30 mt-6 pt-4 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                            <span class="${isOverdue ? "text-red-500 font-bold badge-pulse" : "text-slate-400"}">
                                <i class="fa-regular fa-clock mr-1"></i> Due ${t.due_date}
                            </span>
                            <div class="space-x-1">
                                <button onclick="openEditTaskModal(${t.id}, '${t.title.replace(/'/g, "\\'")}', '${(t.description || '').replace(/'/g, "\\'")}', '${t.due_date}', '${t.category}', '${t.priority}', '${t.status}')" class="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition"><i class="fa-regular fa-pen-to-square text-xs"></i></button>
                                <button onclick="deleteTask(${t.id}, 'tasks')" class="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition"><i class="fa-regular fa-trash-can text-xs"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

    } catch (err) {
        console.error('Failed to load tasks:', err);
    }
}

// Modal management
const modal = document.getElementById('taskModal');
const modalContent = document.getElementById('taskModalContent');

function openAddTaskModal(prefillDate = null) {
    document.getElementById('modal-task-title').innerText = 'Add New Goal Task';
    document.getElementById('modal-task-id').value = '';
    document.getElementById('modal-input-title').value = '';
    document.getElementById('modal-input-description').value = '';
    document.getElementById('modal-input-due-date').value = prefillDate || new Date().toISOString().split('T')[0];
    document.getElementById('modal-input-category').value = 'Personal';
    document.getElementById('modal-input-priority').value = 'Medium';
    document.getElementById('modal-input-status').value = 'Pending';
    document.getElementById('modal-input-status').disabled = true; // Disabled for fresh insertions

    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 50);
}

function openEditTaskModal(id, title, desc, date, cat, prio, status) {
    document.getElementById('modal-task-title').innerText = 'Modify Goal Task';
    document.getElementById('modal-task-id').value = id;
    document.getElementById('modal-input-title').value = title;
    document.getElementById('modal-input-description').value = desc;
    document.getElementById('modal-input-due-date').value = date;
    document.getElementById('modal-input-category').value = cat;
    document.getElementById('modal-input-priority').value = prio;
    document.getElementById('modal-input-status').value = status;
    document.getElementById('modal-input-status').disabled = false; // Enabled for editing

    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 50);
}

function closeTaskModal() {
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 150);
}

async function saveTask(e) {
    e.preventDefault();
    const id = document.getElementById('modal-task-id').value;
    
    const taskData = {
        title: document.getElementById('modal-input-title').value,
        description: document.getElementById('modal-input-description').value,
        due_date: document.getElementById('modal-input-due-date').value,
        category: document.getElementById('modal-input-category').value,
        priority: document.getElementById('modal-input-priority').value,
        status: document.getElementById('modal-input-status').value
    };

    const isEdit = id !== '';
    const url = isEdit ? `/api/tasks/${id}` : '/api/tasks';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (res.ok) {
            closeTaskModal();
            Swal.fire({
                title: 'Task Saved!',
                text: 'Workspace has been successfully synchronized.',
                icon: 'success',
                confirmButtonColor: '#2563EB',
                timer: 1500
            });
            checkActiveViewRefresh();
        } else {
            const data = await res.json();
            Swal.fire('Save Failed', data.error, 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Failed to reach the database server.', 'error');
    }
}

async function deleteTask(id, currentView = 'tasks') {
    const prompt = await Swal.fire({
        title: 'Are you sure?',
        text: 'This will permanently remove the task from your workspace database.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Yes, Delete'
    });

    if (prompt.isConfirmed) {
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Task removed successfully.',
                    icon: 'info',
                    timer: 1500
                });
                checkActiveViewRefresh();
            } else {
                Swal.fire('Error', 'Unable to delete task.', 'error');
            }
        } catch (err) {
            console.error('Deletion failure:', err);
        }
    }
}

async function toggleTask(id, currentView = 'tasks') {
    try {
        const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
        if (res.ok) {
            Swal.fire({
                title: 'Updated!',
                text: 'Goal task status updated.',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });
            checkActiveViewRefresh();
        }
    } catch (err) {
        console.error('Status toggle failed:', err);
    }
}

function checkActiveViewRefresh() {
    const isDashboard = !document.getElementById('dashboard-view').classList.contains('hidden');
    const isTasks = !document.getElementById('tasks-view').classList.contains('hidden');
    const isCalendar = !document.getElementById('calendar-view').classList.contains('hidden');
    
    if (isDashboard) loadDashboard();
    else if (isTasks) loadTasks();
    else if (isCalendar) loadCalendar();
}

// ==========================================
// 5. CALENDAR CONTROLLER
// ==========================================
async function loadCalendar() {
    const calendarEl = document.getElementById('app-calendar');
    
    try {
        const res = await fetch('/api/tasks');
        const tasks = await res.json();

        // Convert SQLite items to FullCalendar events schema
        const events = tasks.map(t => {
            let color = '#2563EB'; // default Blue
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
                    category: t.category,
                    priority: t.priority,
                    status: t.status
                }
            };
        });

        // Initialize Calendar
        if (calendarInstance) {
            calendarInstance.destroy();
        }

        calendarInstance = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events,
            height: 520,
            dateClick: function(info) {
                openAddTaskModal(info.dateStr);
            },
            eventClick: function(info) {
                Swal.fire({
                    title: info.event.title,
                    html: `<div class="text-left text-xs space-y-2 mt-4">
                              <p><strong>Description:</strong> ${info.event.extendedProps.description || 'No milestones specified.'}</p>
                              <p><strong>Category:</strong> ${info.event.extendedProps.category}</p>
                              <p><strong>Priority:</strong> ${info.event.extendedProps.priority}</p>
                              <p><strong>Status:</strong> ${info.event.extendedProps.status}</p>
                           </div>`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#2563EB',
                    cancelButtonColor: '#DC2626',
                    confirmButtonText: 'Modify Task',
                    cancelButtonText: 'Close'
                }).then((result) => {
                    if (result.isConfirmed) {
                        switchView('tasks');
                        openEditTaskModal(
                            info.event.id,
                            info.event.title,
                            info.event.extendedProps.description || '',
                            info.event.startStr,
                            info.event.extendedProps.category,
                            info.event.extendedProps.priority,
                            info.event.extendedProps.status
                        );
                    }
                });
            }
        });

        calendarInstance.render();

    } catch (err) {
        console.error('Calendar render failed:', err);
    }
}

// ==========================================
// 6. PRODUCTIVITY ANALYTICS LOGIC
// ==========================================
async function loadAnalytics() {
    try {
        const res = await fetch('/api/analytics');
        const data = await res.json();

        // Update Gauges Score
        document.getElementById('analytics-gauge-value').innerText = `${data.score}%`;
        
        let desc = "Exceptional workspace flow! You are running highly optimized task schedules.";
        if (data.score < 50) desc = "Focus on checking off pending tasks to raise your productivity index!";
        else if (data.score < 80) desc = "Steady momentum. Keeping task backlogs low will raise your score.";
        document.getElementById('analytics-gauge-desc').innerText = desc;

        // Render Distribution Charts
        renderAnalyticsDoughnutChart(data.completed, data.pending, data.overdue);
        renderAnalyticsPolarChart(data.categories);
        renderAnalyticsBarChart(data.weeklyTrend, data.completed);

    } catch (err) {
        console.error('Failed to compile analytics:', err);
    }
}

function renderAnalyticsDoughnutChart(comp, pend, over) {
    const ctx = document.getElementById('analyticsDoughnutChart').getContext('2d');
    if (charts['doughnut']) charts['doughnut'].destroy();

    charts['doughnut'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending', 'Overdue'],
            datasets: [{
                data: [comp, pend, over],
                backgroundColor: ['#16A34A', '#F59E0B', '#DC2626'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } }
            }
        }
    });
}

function renderAnalyticsPolarChart(categoriesMap) {
    const ctx = document.getElementById('analyticsPolarChart').getContext('2d');
    if (charts['polar']) charts['polar'].destroy();

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);

    charts['polar'] = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 8 } } }
            }
        }
    });
}

function renderAnalyticsBarChart(weeklyTrend, completedCount) {
    const ctx = document.getElementById('analyticsBarChart').getContext('2d');
    if (charts['bar']) charts['bar'].destroy();

    const labels = weeklyTrend.map(t => t.label);
    const completionsDataset = weeklyTrend.map(t => t.completions);

    charts['bar'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Completions',
                    data: completionsDataset,
                    backgroundColor: '#16A34A',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

// ==========================================
// 7. PROFILE PREFERENCES
// ==========================================
async function loadProfile() {
    // Fetch statistics breakdown
    const res = await fetch('/api/analytics');
    const data = await res.json();

    document.getElementById('profile-total-count').innerText = data.total;
    document.getElementById('profile-completed-count').innerText = data.completed;

    document.getElementById('profile-name').innerText = currentUser.name;
    document.getElementById('profile-email').innerText = currentUser.email;

    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    document.getElementById('profile-avatar').innerText = initials || 'U';

    // Populate profile editing fields
    document.getElementById('profile-input-name').value = currentUser.name;
    document.getElementById('profile-input-email').value = currentUser.email;
    document.getElementById('profile-input-password').value = '';
    document.getElementById('profile-input-confirm').value = '';
}

async function updateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('profile-input-name').value;
    const email = document.getElementById('profile-input-email').value;
    const password = document.getElementById('profile-input-password').value;
    const confirm = document.getElementById('profile-input-confirm').value;

    if (password !== '' && password !== confirm) {
        return Swal.fire('Mismatch', 'Confirm password does not match.', 'warning');
    }

    const updateData = { name, email };
    if (password !== '') {
        updateData.password = password;
    }

    try {
        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            Swal.fire({
                title: 'Profile Updated!',
                text: 'Your settings have been saved successfully.',
                icon: 'success',
                confirmButtonColor: '#2563EB',
                timer: 1500
            });
            loadProfile();
            
            // Sync top navbar
            document.getElementById('user-display-name').innerText = currentUser.name;
            document.getElementById('user-display-email').innerText = currentUser.email;
            const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.getElementById('user-display-initials').innerText = initials || 'U';
        } else {
            const data = await res.json();
            Swal.fire('Update Failed', data.error, 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Unable to reach update servers.', 'error');
    }
}
