import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import RecordTable from '../components/RecordTable';
import UploadRecord from '../components/UploadRecord';
import { useAuth } from '../context/AuthContext';
import { getMyRecords } from '../api/records';

/**
 * PatientDashboard - Main patient view.
 * Shows record list, upload button, grant/revoke access controls.
 */
export default function PatientDashboard() {
  const { walletAddress } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navItems = [
    {
      label: 'Dashboard',
      active: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      ),
    },
    {
      label: 'My Records',
      active: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => {
        window.scrollTo({ top: 300, behavior: 'smooth' });
      },
    },
    {
      label: 'Upload Record',
      active: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => {
        document.getElementById('upload-record-btn')?.click();
      },
    },
  ];

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyRecords();
      setRecords(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to load records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  function handleUploadSuccess() {
    fetchRecords();
  }

  // Derived summary values from records data
  const totalRecords = records.length;
  const authorizedDoctorsCount = records.reduce(
    (acc, rec) => acc + (rec.authorizedDoctors?.length || 0),
    0
  );
  const recentRecord = records[0]?.label || 'None yet';

  return (
    <Layout navItems={navItems}>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Patient Dashboard</h1>
          <p className="page-description">
            Manage your healthcare records and control who can access them.
          </p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Total Records</span>
            <div className="summary-card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="summary-card-value">{totalRecords}</div>
          <div className="summary-card-sub">Encrypted & pinned to IPFS</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Authorized Doctors</span>
            <div className="summary-card-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M3 17a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="summary-card-value">{authorizedDoctorsCount}</div>
          <div className="summary-card-sub">Granted on-chain permissions</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Recent Upload</span>
            <div className="summary-card-icon" style={{ backgroundColor: '#f1f5f9', color: 'var(--color-text-secondary)' }} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="summary-card-value" style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={recentRecord}>
            {recentRecord}
          </div>
          <div className="summary-card-sub">Latest repository update</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Access Status</span>
            <div className="summary-card-icon" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 9V6a3 3 0 116 0v3" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            </div>
          </div>
          <div className="summary-card-value" style={{ fontSize: '1.25rem', color: 'var(--color-accent)' }}>
            Patient Controlled
          </div>
          <div className="summary-card-sub">Smart contract verified</div>
        </div>
      </div>

      {/* Wallet address info bar */}
      <div className="info-bar" aria-label="Connected wallet information">
        <div className="info-bar-left">
          <span className="info-label">Connected Wallet</span>
          <span className="info-value" title={walletAddress}>{walletAddress || '—'}</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Role: <strong style={{ color: 'var(--color-text-primary)' }}>Patient</strong>
        </div>
      </div>

      {/* Records section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>My Healthcare Records</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              View your records, assign doctor access, or revoke permissions on-chain.
            </p>
          </div>
          <UploadRecord onSuccess={handleUploadSuccess} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <RecordTable
            records={records}
            loading={loading}
            error={error}
            onRecordUpdate={fetchRecords}
          />
        </div>
      </div>

      {/* How it works note for demo */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
          borderLeft: '3px solid var(--color-accent)',
        }}
      >
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-accent)',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Demo Flow
        </div>
        <ol
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            paddingLeft: '16px',
            lineHeight: '1.9',
            margin: 0,
          }}
        >
          <li>Upload a medical record using the button above.</li>
          <li>Click <strong>Grant Access</strong> and enter the doctor's wallet address.</li>
          <li>Log in as the doctor and verify access is granted.</li>
          <li>Return here and click <strong>Revoke</strong> next to the doctor's name.</li>
          <li>Log in as the doctor again — access will be denied.</li>
        </ol>
      </div>
    </Layout>
  );
}
