import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const StatusBadge = ({ status }) => {
  const map = { TODO: ['badge-todo', 'To Do'], IN_PROGRESS: ['badge-progress', 'In Progress'], DONE: ['badge-done', 'Done'] };
  const [cls, label] = map[status] || ['badge-todo', status];
  return <span className={`badge ${cls}`}>{label}</span>;
};

const isOverdue = (dueDate, status) =>
  dueDate && status !== 'DONE' && new Date(dueDate) < new Date();

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/tasks/dashboard'), api.get('/projects')])
      .then(([s, p]) => { setStats(s.data); setProjects(p.data.slice(0, 4)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  const recentTasks = projects.flatMap((p) =>
    (p.tasks || []).map((t) => ({ ...t, projectName: p.name, projectId: p.id }))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📁</div>
          <div><div className="stat-value">{stats?.totalProjects ?? 0}</div><div className="stat-label">Total Projects</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📋</div>
          <div><div className="stat-value">{stats?.totalTasks ?? 0}</div><div className="stat-label">Total Tasks</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">⚡</div>
          <div><div className="stat-value">{stats?.statusCounts?.IN_PROGRESS ?? 0}</div><div className="stat-label">In Progress</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⚠️</div>
          <div><div className="stat-value">{stats?.overdueTasks ?? 0}</div><div className="stat-label">Overdue</div></div>
        </div>
      </div>

      <div className="section-row">
        {/* Recent Projects */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Recent Projects</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>View All →</button>
          </div>
          {projects.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📁</div>
              <div className="empty-text">No projects yet</div>
              <div className="empty-sub">Go to Projects to create one</div>
            </div>
          ) : projects.map((p) => (
            <div key={p.id} className="project-card" style={{ marginBottom: 10 }} onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="flex-between">
                <span className="project-name">{p.name}</span>
                <span className={`badge ${p.myRole === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{p.myRole}</span>
              </div>
              <div className="project-meta">
                <span className="project-meta-item">👥 {p._count?.members} members</span>
                <span className="project-meta-item">📋 {p._count?.tasks} tasks</span>
              </div>
              <div className="project-status-row">
                <span className="status-mini" style={{ color: 'var(--todo-color)' }}>● {(p.tasks || []).filter(t => t.status === 'TODO').length} Todo</span>
                <span className="status-mini" style={{ color: 'var(--warning)' }}>● {(p.tasks || []).filter(t => t.status === 'IN_PROGRESS').length} In Progress</span>
                <span className="status-mini" style={{ color: 'var(--success)' }}>● {(p.tasks || []).filter(t => t.status === 'DONE').length} Done</span>
              </div>
            </div>
          ))}
        </div>

        {/* Status breakdown + recent tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h2 className="section-title">Task Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['TODO',        stats?.statusCounts?.TODO ?? 0,        'var(--todo-color)',  'var(--todo-bg)'],
                ['IN_PROGRESS', stats?.statusCounts?.IN_PROGRESS ?? 0, 'var(--warning)',     'var(--warning-bg)'],
                ['DONE',        stats?.statusCounts?.DONE ?? 0,        'var(--success)',     'var(--success-bg)'],
              ].map(([key, count, color, bg]) => {
                const total = stats?.totalTasks || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex-between text-sm" style={{ marginBottom: 5 }}>
                      <span style={{ color, fontWeight: 600 }}>{key.replace('_', ' ')}</span>
                      <span className="text-muted">{count} tasks</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 6, height: 7 }}>
                      <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 6, transition: 'width .4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">My Assigned Tasks</h2>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{stats?.myTasks ?? 0}</div>
            <div className="text-sm text-muted" style={{ marginTop: 4 }}>tasks assigned to you</div>
            {stats?.overdueTasks > 0 && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: 8, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
                ⚠️ {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
