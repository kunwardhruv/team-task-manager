# TeamFlow — Team Task Manager

> A full-stack project management web app with role-based access control, kanban task board, and team collaboration features.

**🌐 Live URL:** [https://team-task-manager-1oo0.onrender.com](https://team-task-manager-1oo0.onrender.com)  
**📁 GitHub:** [https://github.com/kunwardhruv/team-task-manager](https://github.com/kunwardhruv/team-task-manager)

---

## Features

- **Authentication** — Secure Signup/Login using JWT tokens + bcrypt password hashing
- **Projects** — Create, edit, delete projects. Invite team members by email.
- **Role-Based Access** — ADMIN (full control) vs MEMBER (view + update assigned tasks only)
- **Task Management** — Create tasks, assign to members, set due dates, track status
- **Kanban Board** — Visual board with To Do / In Progress / Done columns
- **Dashboard** — Overview of projects, task counts, status breakdown, overdue alerts

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, React Router, Axios |
| Backend    | Node.js, Express.js                 |
| Database   | PostgreSQL (via Prisma ORM)         |
| Auth       | JWT + bcrypt                        |
| Deployment | Render.com                          |

---

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| GET | `/api/projects` | List user's projects | Any member |
| POST | `/api/projects` | Create project | Any member |
| GET | `/api/projects/:id` | Project detail with members & tasks | Member |
| PUT | `/api/projects/:id` | Update project | Admin only |
| DELETE | `/api/projects/:id` | Delete project | Admin only |
| POST | `/api/projects/:id/members` | Add member by email | Admin only |
| DELETE | `/api/projects/:id/members/:uid` | Remove member | Admin only |

### Tasks
| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| POST | `/api/tasks` | Create task | Admin only |
| PUT | `/api/tasks/:id` | Update task / change status | Admin or Assignee |
| DELETE | `/api/tasks/:id` | Delete task | Admin only |
| GET | `/api/tasks/dashboard` | Dashboard stats | Any member |

---

## Role-Based Access Control

| Action | ADMIN | MEMBER |
|--------|-------|--------|
| Create / Edit / Delete task | ✅ | ❌ |
| Update status of own task | ✅ | ✅ |
| Add / Remove members | ✅ | ❌ |
| Edit / Delete project | ✅ | ❌ |
| View board & tasks | ✅ | ✅ |

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/kunwardhruv/team-task-manager.git
cd team-task-manager

# 2. Backend setup
cd backend
cp .env.example .env
# Add DATABASE_URL and JWT_SECRET in .env

# 3. Run DB migrations
npx prisma migrate dev --name init

# 4. Start backend (Terminal 1)
yarn dev

# 5. Frontend setup (Terminal 2)
cd ../frontend
yarn install
yarn dev
```

- Frontend → `http://localhost:5173`
- Backend → `http://localhost:5000`

---

## Deployment (Render.com)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect repo
3. Set **Build Command:**
```
npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build && mkdir -p backend/public && cp -r frontend/dist/. backend/public/
```
4. Set **Start Command:** `npm start`
5. Add **PostgreSQL** database on Render → copy Internal URL
6. Add Environment Variables:
```
DATABASE_URL = <your-render-postgres-url>
JWT_SECRET   = <your-secret-key>
```
7. Deploy → Live in 3-4 minutes ✅

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # DB schema (User, Project, Task, Member)
│   ├── src/
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API route definitions
│   │   ├── middleware/auth.js   # JWT verification middleware
│   │   └── index.js             # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/               # Login, Register, Dashboard, Projects, ProjectDetail
│   │   ├── components/          # Sidebar, Modal, PrivateRoute
│   │   ├── context/             # Auth context (global user state)
│   │   └── api/                 # Axios instance with interceptors
│   └── package.json
├── package.json                 # Root build scripts for deployment
└── README.md
```

---

## Author

**Dhruv Singh** — B.Tech AI & Data Science, GGSIPU (2022–2026)
