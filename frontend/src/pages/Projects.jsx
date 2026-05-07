import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name required');
    setSaving(true); setError('');
    try {
      await api.post('/projects', form);
      setShowModal(false); setForm({ name: '', description: '' }); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon">📁</div>
          <div className="empty-text">No projects yet</div>
          <div className="empty-sub">Create your first project to get started</div>
          <button className="btn btn-primary mt-16" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="card-grid card-grid-3">
          {projects.map((p) => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="project-card-header">
                <span className="project-name">{p.name}</span>
                <span className={`badge ${p.myRole === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{p.myRole}</span>
              </div>
              {p.description && <p className="project-desc">{p.description}</p>}
              <div className="project-meta">
                <span className="project-meta-item">👥 {p._count?.members}</span>
                <span className="project-meta-item">📋 {p._count?.tasks} tasks</span>
                <span className="project-meta-item">📅 {new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="project-status-row">
                <span className="status-mini" style={{ color: 'var(--todo-color)' }}>● {(p.tasks || []).filter(t => t.status === 'TODO').length} Todo</span>
                <span className="status-mini" style={{ color: 'var(--warning)' }}>● {(p.tasks || []).filter(t => t.status === 'IN_PROGRESS').length} In Progress</span>
                <span className="status-mini" style={{ color: 'var(--success)' }}>● {(p.tasks || []).filter(t => t.status === 'DONE').length} Done</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Create New Project" onClose={() => { setShowModal(false); setError(''); }}>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" placeholder="What is this project about?" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="flex-gap mt-16" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
