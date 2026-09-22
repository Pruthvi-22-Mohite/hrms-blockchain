import { useState } from 'react';
import Sidebar from './Sidebar';

/**
 * Layout - Main dashboard layout with sidebar + content area.
 *
 * Props:
 *   navItems: Array for Sidebar
 *   children: React.ReactNode - Main content
 */
export default function Layout({ navItems, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile hamburger toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      <Sidebar
        navItems={navItems}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="app-main">
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
