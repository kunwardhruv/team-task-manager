import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setError(''); setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">✦</span>
          <span className="auth-logo-text">TeamFlow</span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start managing your team's tasks today</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" name="name"
              placeholder="Your name" value={form.name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email"
              placeholder="you@example.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password"
              placeholder="Min. 6 characters" value={form.password} onChange={handle} required />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-full mt-16" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider" />
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
