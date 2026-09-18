import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';

/**
 * Login page - Professional healthcare login.
 * No password field (demo mode). Uses name + role.
 */
export default function Login() {
  const { isAuthenticated, role: existingRole, loginUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged in → redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={existingRole === 'doctor' ? '/doctor' : '/patient'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(name.trim(), role);
      loginUser({ ...userData, name: userData.name || name.trim() });
      navigate(userData.role === 'doctor' ? '/doctor' : '/patient', { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please check your details and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Left informational panel */}
      <div className="login-left-panel" aria-hidden="true">
        <div>
          <div className="login-brand-name">HealthChain</div>
          <div className="login-brand-sub">Blockchain Healthcare Records</div>
        </div>

        <div className="login-left-content">
          <h2>Secure. Decentralized. Patient-controlled.</h2>
          <p>
            A blockchain-powered healthcare record management system that puts
            patients in full control of their medical data.
          </p>
          <div className="login-features">
            <div className="login-feature-item">
              <span className="login-feature-dot"></span>
              Immutable audit trail for every access event
            </div>
            <div className="login-feature-item">
              <span className="login-feature-dot"></span>
              Patient-controlled doctor access permissions
            </div>
            <div className="login-feature-item">
              <span className="login-feature-dot"></span>
              IPFS-based decentralized file storage
            </div>
            <div className="login-feature-item">
              <span className="login-feature-dot"></span>
              Ethereum smart contract access enforcement
            </div>
          </div>
        </div>

        <div className="login-footer-note">
          VITP — Blockchain Technology Course Project
        </div>
      </div>

      {/* Right login form */}
      <div className="login-right-panel">
        <div className="login-form-container">
          <h1>Sign In</h1>
          <p className="login-subtitle">
            Access the HealthChain portal
          </p>

          <div className="demo-note" role="note">
            <strong>Demo Mode:</strong> Enter any name and select your role to log in.
            No password required for this demonstration.
          </div>

          {error && (
            <div className="error-state" role="alert" style={{ marginBottom: '20px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-name">Full Name</label>
              <input
                id="login-name"
                type="text"
                className="form-control"
                placeholder="e.g. Riya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-role">Role</label>
              <select
                id="login-role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              id="login-submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick fill buttons for demo convenience */}
          <div style={{ marginTop: '32px', borderTop: '1px solid var(--color-border-light)', paddingTop: '22px' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)', marginBottom: '12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              One-Click Demo Profiles
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '10px 12px', fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                onClick={() => { setName('Riya Sharma'); setRole('patient'); }}
                disabled={loading}
                id="demo-patient-btn"
              >
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>Riya Sharma</span>
                <span style={{ color: 'var(--color-accent)', fontSize: '11px' }}>Patient</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '10px 12px', fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                onClick={() => { setName('Dr. Kapoor'); setRole('doctor'); }}
                disabled={loading}
                id="demo-doctor-btn"
              >
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>Dr. Kapoor</span>
                <span style={{ color: 'var(--color-success)', fontSize: '11px' }}>Doctor</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
