# 🌊 SmartFlow — Smart Task Management Web Application

**SmartFlow** is a premium, full-stack productivity workspace inspired by modern SaaS designs like **Notion**, **Linear**, and **Todoist**. Built using a sleek, minimal, light-themed aesthetic, it is fully responsive, dynamic, and self-contained. 

Instead of heavy Java JSP setups requiring complex Tomcat configurations, JDK installations, and separate MySQL database servers, this application runs entirely on a modern **Node.js, Express, and SQLite** web architecture. It initializes its own database file, seeds dummy data automatically, and lets you manage task priorities, deadlines, and charts out-of-the-box.

---

## ✨ Features Breakdown

1. **User Session Authentication**: Clean login and registration forms featuring professional password hashing via `bcryptjs` and dynamic session cookies.
2. **Dynamic Dashboard**: Responsive metrics cards tracking Total, Pending, Completed, and Overdue tasks, along with upcoming deadlines and a task summary table.
3. **Advanced Task Filtering**: High-fidelity searching and dynamic dropdown filtering (by priority weight, task category, and status).
4. **Interactive Calendar Planner**: Integrates `FullCalendar.js` dynamically. Displays month-view cards, enables scheduler popups, and syncs status colors.
5. **Productivity Analytics**: Multiple real-time `Chart.js` graphs (doughnut ratio splits, polar-area categories, and weekly completion trend-lines).
6. **Workspace Customization**: Fully editable profile name, email preferences, and password settings, alongside a custom local-saved **Dark Mode toggle**.
7. **Zero-Setup Database (SQLite)**: Automatically creates a `database.sqlite` file and seeds active demo datasets on initial boot.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, Tailwind CSS, Vanilla JS, Font Awesome 6, `SweetAlert2` (custom banners), `Chart.js` (analytics), `FullCalendar.js` (scheduler).
* **Backend**: Node.js + Express (dynamic routing and REST API controllers).
* **Database**: SQLite3 (local, lightweight SQL database file).
* **Security & Session**: `express-session` cookies and `bcryptjs` encryption.

---

## 🚀 Step-by-Step Run Instructions

Since all node packages have already been successfully installed, starting and viewing your project takes less than 5 seconds:

### Step 1: Launch the Local Server
Open your terminal in the workspace directory (`c:\Users\yadav\OneDrive\Desktop\web dev mini porject`) and execute:
```bash
npm start
```
This boots up the Express backend and sets up the local database:
```text
====================================================
  SmartFlow Web Application started on port 3000
  Access URL: http://localhost:3000
====================================================
```

### Step 2: Open in your Web Browser
Open your browser and navigate to:
```text
http://localhost:3000
```

### Step 3: Login with Seeded Demo Credentials
The database has already seeded a default professional account so you can test all views instantly:
* **Demo Email**: `demo@smartflow.com`
* **Demo Password**: `password123`

*(Note: You can also click "Create Account" to sign up with a fresh registration at any time!)*

---

## 📂 Codebase Architecture

```text
smartflow-task-manager/
├── database.sqlite       # Auto-created SQLite relational database file
├── server.js             # Express backend, SQLite connections, and REST API handlers
├── package.json          # Node.js dependencies configuration
├── README.md             # Developer setup manual
└── public/               # Static SPA assets served by Express
    ├── index.html        # High-fidelity Single Page App UI Frame
    ├── css/
    │   └── styles.css    # Custom scrollbars, glassmorphism, and checkboxes
    ├── js/
    │   └── app.js        # Dynamic view toggles, AJAX fetches, and chart loaders
    └── images/
        ├── logo.svg      # Vector brand logo gradient
        └── empty-state.svg # Empty state graphic illustration
```

---

*Made with 💙 as a Web Development Mini-Project. Enjoy organizing your weekly goals!*
