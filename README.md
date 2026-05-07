# TeamFlow — Team Task Manager

A full-stack web application for creating projects, assigning tasks, and tracking team progress with role-based access control.

**Live URL:** `[Your Railway URL here]`  
**GitHub Repo:** `[Your GitHub URL here]`

---

## Features

- **Authentication** — Signup/Login with JWT tokens
- **Projects** — Create, edit, delete projects. Invite team members by email.
- **Role-Based Access** — ADMIN (full control) vs MEMBER (view + update assigned tasks)
- **Task Management** — Create tasks, assign to members, set due dates, track status
- **Kanban Board** — Visual task board with To Do / In Progress / Done columns
- **Dashboard** — Stats overview: projects, tasks, status breakdown, overdue count

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React 18, Vite, React Router  |
| Backend    | Node.js, Express.js           |
| Database   | PostgreSQL (via Prisma ORM)   |
| Auth       | JWT + bcrypt                  |
| Deployment | Railway                       |

## API Endpoints

### Auth
| Method | Route            | Description         |
|--------|------------------|---------------------|
| POST   | /api/auth/signup | Register new user   |
| POST   | /api/auth/login  | Login               |
| GET    | /api/auth/me     | Get current user    |

### Projects
| Method | Route                           | Description             | Access  |
|--------|---------------------------------|-------------------------|---------|
| GET    | /api/projects                   | List user's projects    | Any     |
| POST   | /api/projects                   | Create project          | Any     |
| GET    | /api/projects/:id               | Project detail          | Member  |
| PUT    | /api/projects/:id               | Update project          | Admin   |
| DELETE | /api/projects/:id               | Delete project          | Admin   |
| POST   | /api/projects/:id/members       | Add member by email     | Admin   |
| DELETE | /api/projects/:id/members/:uid  | Remove member           | Admin   |

### Tasks
| Method | Route           | Description         | Access         |
|--------|-----------------|---------------------|----------------|
| POST   | /api/tasks      | Create task         | Admin          |
| PUT    | /api/tasks/:id  | Update task/status  | Admin/Assignee |
| DELETE | /api/tasks/:id  | Delete task         | Admin          |
| GET    | /api/tasks/dashboard | Dashboard stats | Any          |

## Role-Based Access

| Action                  | ADMIN | MEMBER |
|-------------------------|-------|--------|
| Create/Edit/Delete task | ✅    | ❌     |
| Update own task status  | ✅    | ✅     |
| Add/Remove members      | ✅    | ❌     |
| Edit project            | ✅    | ❌     |
| View tasks & board      | ✅    | ✅     |

## Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd team-task-manager

# 2. Backend setup
cd backend
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Start backend
npm run dev

# 5. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

## Railway Deployment

1. Push code to GitHub
2. Create new project on [railway.app](https://railway.app)
3. Add **PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`
4. Connect your GitHub repo
5. Add environment variable: `JWT_SECRET=your_secret_here`
6. Railway auto-runs `npm run build` then `npm start`
7. Done — your app is live!

## Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/schema.prisma     # DB schema
│   ├── src/
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API endpoints
│   │   ├── middleware/auth.js   # JWT verification
│   │   └── index.js             # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/               # React pages
│   │   ├── components/          # Reusable components
│   │   ├── context/             # Auth context
│   │   └── api/                 # Axios instance
│   └── package.json
├── railway.toml                 # Railway config
└── package.json                 # Root build scripts
```
