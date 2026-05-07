import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Modal from '../components/Modal';

const STATUS_COLS = [
  { key: 'TODO',        label: 'To Do',      color: 'var(--todo-color)',  dot: '○' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'var(--warning)',     dot: '◑' },
  { key: 'DONE',        label: 'Done',        color: 'var(--success)',     dot: '●' },
];

const isOverdue = (d, s) => d && s !== 'DONE' && new Date(d) < new Date();

const StatusBadge = ({ status }) => {
  const m = { TODO: ['badge-todo', 'To Do'], IN_PROGRESS: ['badge-progress', 'In Progress'], DONE: ['badge-done', 'Done'] };
  const [c, l] = m[status] || ['badge-todo', status];
  return <span className={`badge ${c}`}>{l}</span>;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');

  // Modals
  const [taskModal, setTaskModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  // Forms
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', dueDate: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/projects/${id}`).then(r => {
      setProject(r.data);
      setEditForm({ name: r.data.name, description: r.data.description || '' });
    }).catch(() => navigate('/projects')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const isAdmin = project?.myRole === 'ADMIN';

  // ── Create Task ──────────────────────────────────
  const createTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return setErr('Title required');
    setSaving(true); setErr('');
    try {
      await api.post('/tasks', { ...taskForm, projectId: id });
      setTaskModal(false); setTaskForm({ title: '', description: '', assigneeId: '', dueDate: '' }); load();
    } catch (er) { setErr(er.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  // ── Update Task Status ───────────────────────────
  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      load();
    } catch (er) { alert(er.response?.data?.error || 'Failed to update'); }
  };

  // ── Delete Task ──────────────────────────────────
  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); load(); }
    catch (er) { alert(er.response?.data?.error || 'Failed to delete'); }
  };

  // ── Add Member ───────────────────────────────────
  const addMember = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setMemberModal(false); setMemberEmail(''); load();
    } catch (er) { setErr(er.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  // ── Remove Member ────────────────────────────────
  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); load(); }
    catch (er) { alert(er.response?.data?.error || 'Failed'); }
  };

  // ── Edit Project ─────────────────────────────────
  const editProject = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      await api.put(`/projects/${id}`, editForm);
      setEditModal(false); load();
    } catch (er) { setErr(er.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  // ── Delete Project ───────────────────────────────
  const deleteProject = async () => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try { await api.delete(`/projects/${id}`); navigate('/projects'); }
    catch (er) { alert(er.response?.data?.error || 'Failed to delete'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;
  if (!project) return null;

  const tasks = project.tasks || [];

  return (
    <>
      {/* Header */}
      <div className="detail-header">
        <div className="flex-between">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>← Back</button>
          {isAdmin && (
            <div className="flex-gap">
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditModal(true); setErr(''); }}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={deleteProject}>Delete</button>
            </div>
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <h1 className="detail-title">{project.name}</h1>
          {project.description && <p className="detail-desc">{project.description}</p>}
          <div className="detail-meta">
            <span className="detail-meta-item">👤 Owner: {project.owner?.name}</span>
            <span className="detail-meta-item">👥 {project.members?.length} members</span>
            <span className="detail-meta-item">📋 {tasks.length} tasks</span>
            <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-member'}`}>You: {project.myRole}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>📋 Task Board</button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>👥 Members</button>
      </div>

      {/* ── BOARD TAB ── */}
      {activeTab === 'board' && (
        <>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Task Board</h2>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => { setTaskModal(true); setErr(''); }}>+ Add Task</button>
            )}
          </div>
          <div className="board">
            {STATUS_COLS.map(({ key, label, color, dot }) => {
              const colTasks = tasks.filter(t => t.status === key);
              return (
                <div key={key} className="board-col">
                  <div className="board-col-header">
                    <span className="board-col-title" style={{ color }}>
                      {dot} {label}
                    </span>
                    <span className="board-col-count">{colTasks.length}</span>
                  </div>
                  <div className="board-tasks">
                    {colTasks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 8px', color: 'var(--text-3)', fontSize: 13 }}>No tasks</div>
                    )}
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isAdmin={isAdmin}
                        currentUserId={user?.id}
                        onStatusChange={updateStatus}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── MEMBERS TAB ── */}
      {activeTab === 'members' && (
        <>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Team Members</h2>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => { setMemberModal(true); setErr(''); }}>+ Add Member</button>
            )}
          </div>
          <div className="card">
            {project.members.map(({ user: u, role }) => (
              <div key={u.id} className="member-item">
                <div className="avatar" style={{ width: 38, height: 38, fontSize: 15 }}>{u.name?.[0]?.toUpperCase()}</div>
                <div className="member-info">
                  <div className="member-name">{u.name} {u.id === user?.id && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>(you)</span>}</div>
                  <div className="member-email">{u.email}</div>
                </div>
                <div className="member-actions">
                  <span className={`badge ${role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{role}</span>
                  {isAdmin && u.id !== user?.id && (
                    <button className="btn btn-danger btn-sm" onClick={() => removeMember(u.id)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MODALS ── */}

      {/* Create Task Modal */}
      {taskModal && (
        <Modal title="Create New Task" onClose={() => { setTaskModal(false); setErr(''); }}>
          <form onSubmit={createTask}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="Task title" value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" placeholder="Task description (optional)" value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-input" value={taskForm.assigneeId}
                onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members.map(({ user: u }) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={taskForm.dueDate}
                onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
            {err && <div className="form-error">{err}</div>}
            <div className="flex-gap mt-16" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setTaskModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Task'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Member Modal */}
      {memberModal && (
        <Modal title="Add Team Member" onClose={() => { setMemberModal(false); setErr(''); }}>
          <form onSubmit={addMember}>
            <div className="form-group">
              <label className="form-label">Member Email *</label>
              <input className="form-input" type="email" placeholder="member@example.com" value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)} required />
              <p className="text-xs text-muted" style={{ marginTop: 5 }}>User must already have an account</p>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {err && <div className="form-error">{err}</div>}
            <div className="flex-gap mt-16" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setMemberModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Project Modal */}
      {editModal && (
        <Modal title="Edit Project" onClose={() => { setEditModal(false); setErr(''); }}>
          <form onSubmit={editProject}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            {err && <div className="form-error">{err}</div>}
            <div className="flex-gap mt-16" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ── Task Card Component ──────────────────────────────
function TaskCard({ task, isAdmin, currentUserId, onStatusChange, onDelete }) {
  const canUpdate = isAdmin || task.assigneeId === currentUserId;
  const overdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date();

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className="task-title">{task.title}</span>
        {isAdmin && (
          <button onClick={() => onDelete(task.id)}
            style={{ background: 'none', color: 'var(--text-3)', fontSize: 14, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}
            title="Delete task">✕</button>
        )}
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {task.assignee ? (
            <span className="task-assignee">
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {task.assignee.name?.[0]?.toUpperCase()}
              </span>
              {task.assignee.name}
            </span>
          ) : (
            <span className="task-assignee" style={{ color: 'var(--text-3)' }}>Unassigned</span>
          )}
          {task.dueDate && (
            <span className={`task-due ${overdue ? 'overdue' : ''}`}>
              {overdue ? '⚠ ' : '📅 '}
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {canUpdate && (
          <select
            className="status-select"
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value)}
            style={{
              color: task.status === 'TODO' ? 'var(--todo-color)' : task.status === 'IN_PROGRESS' ? 'var(--warning)' : 'var(--success)',
              borderColor: task.status === 'TODO' ? 'var(--todo-color)' : task.status === 'IN_PROGRESS' ? 'var(--warning)' : 'var(--success)',
            }}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        )}
      </div>
    </div>
  );
}
