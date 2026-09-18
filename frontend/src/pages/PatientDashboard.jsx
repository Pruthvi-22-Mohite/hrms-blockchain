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
      label: 'Patient Dashboard',
      active: true,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
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

  return (
    <Layout navItems={navItems}>
      {/* Page header */}
      <div className="page-header">
        <h1>Patient Dashboard</h1>
        <p className="page-description">
          Manage your healthcare records and control doctor access permissions.
        </p>
      </div>

      {/* Wallet address info bar */}
      <div className="info-bar" aria-label="Connected wallet information">
        <span className="info-label">Wallet Address</span>
        <span className="info-value" title={walletAddress}>{walletAddress || '—'}</span>
      </div>

      {/* Records section */}
      <div className="card">
        <div className="card-header">
          <h2>My Medical Records</h2>
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
