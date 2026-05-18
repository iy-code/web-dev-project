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

When cloning this project on a new computer, follow these simple setup steps to run the application:

### Step 1: Install Dependencies
Open your terminal in the cloned repository root folder and install all required node modules for the root, backend, and frontend folders with a single command:
```bash
npm run install-all
```

---

### 📦 Option A: Zero-Setup SQLite Architecture (Fastest)

This boots up a self-contained full-stack server using Express and local SQLite. No database servers or complex configuration needed!

1. **Launch the Server:**
   From the repository root folder, run:
   ```bash
   npm start
   ```
2. **Access in Browser:**
   Open [http://localhost:3000](http://localhost:3000)
3. **Log in with Seeded Credentials:**
   * **Demo Email:** `demo@smartflow.com`
   * **Demo Password:** `password123`
   *(Or click "Create Account" to register a new user!)*

---

### ⚡ Option B: React + MySQL Architecture

This launches the separate modern React frontend and Express backend connected to a MySQL server.

1. **Setup Environment Variables:**
   - Go to the `backend/` directory.
   - Copy `backend/.env.example` to `backend/.env`.
   - Update your MySQL connection credentials in `backend/.env` (e.g. host, user, password, and database name).
2. **Start the Backend Server:**
   - Navigate to the `backend/` directory:
     ```bash
     cd backend
     npm start
     ```
   - This automatically creates the MySQL database and relational tables.
3. **Start the Frontend React App:**
   - Open a separate terminal, navigate to the `frontend/` directory:
     ```bash
     cd frontend
     npm run dev
     ```
   - Open the web app link shown in the terminal (usually [http://localhost:3000](http://localhost:3000)).

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
