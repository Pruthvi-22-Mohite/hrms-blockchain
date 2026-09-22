import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Sidebar - Navigation sidebar for dashboards.
 *
 * Props:
 *   navItems: Array<{ label, icon, active }>
 *   mobileOpen: boolean
 *   onMobileClose: function
 */
export default function Sidebar({ navItems = [], mobileOpen, onMobileClose }) {
  const { name, role, walletAddress, logoutUser } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  // Truncate wallet address for display
  function truncateWallet(address) {
    if (!address) return '';
    if (address.length <= 14) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99,
          }}
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${mobileOpen ? ' open' : ''}`} role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="app-name">HealthChain</div>
          <div className="app-subtitle">Healthcare Record System</div>
        </div>

        {/* Profile */}
        <div className="sidebar-profile">
          <div className="profile-role">{role === 'patient' ? 'Patient' : 'Doctor'}</div>
          <div className="profile-name">{name || '—'}</div>
          <div className="profile-wallet" title={walletAddress}>
            {truncateWallet(walletAddress)}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`sidebar-nav-item${item.active ? ' active' : ''}`}
              aria-current={item.active ? 'page' : undefined}
              onClick={item.onClick}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="sidebar-nav-item"
            onClick={handleLogout}
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3m0 0l-3-3m3 3H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
