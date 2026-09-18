import { useState } from 'react';
import Layout from '../components/Layout';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { checkAccess, viewRecord } from '../api/records';

/**
 * DoctorDashboard - Doctor's view.
 * Allows record lookup by ID, access check, and record viewing.
 *
 * Demo flow:
 * 1. Doctor enters record ID
 * 2. System checks access → ACCESS GRANTED or ACCESS DENIED
 * 3. If granted, doctor clicks View Record
 * 4. Record content is displayed
 */
export default function DoctorDashboard() {
  const { walletAddress } = useAuth();

  const [recordId, setRecordId] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [accessResult, setAccessResult] = useState(null); // { authorized: bool }

  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [recordData, setRecordData] = useState(null);

  const navItems = [
    {
      label: 'Doctor Dashboard',
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

  function resetCheck() {
    setAccessResult(null);
    setRecordData(null);
    setCheckError('');
    setViewError('');
  }

  async function handleCheckAccess(e) {
    e.preventDefault();
    setCheckError('');
    setAccessResult(null);
    setRecordData(null);
    setViewError('');

    const trimmed = recordId.trim();
    if (!trimmed) {
      setCheckError('Please enter a Record ID.');
      return;
    }

    setCheckLoading(true);
    try {
      const result = await checkAccess(trimmed);
      setAccessResult(result);
    } catch (err) {
      setCheckError(
        err?.response?.data?.message ||
          'Failed to check access. Please verify the Record ID and try again.'
      );
    } finally {
      setCheckLoading(false);
    }
  }

  // Only called when access check returned true
  async function handleViewRecord() {
    setViewError('');
    setRecordData(null);
    setViewLoading(true);
    try {
      const data = await viewRecord(recordId.trim());
      setRecordData(data);
    } catch (err) {
      const isAccessDenied =
        err?.response?.status === 403 ||
        err?.response?.data?.error === 'ACCESS_DENIED';
      if (isAccessDenied) {
        // Access was revoked between check and view
        setAccessResult({ authorized: false });
        setViewError('Access was revoked. You no longer have permission to view this record.');
      } else {
        setViewError(
          err?.response?.data?.message || 'Failed to load record. Please try again.'
        );
      }
    } finally {
      setViewLoading(false);
    }
  }

  function isUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <Layout navItems={navItems}>
      {/* Page header */}
      <div className="page-header">
        <h1>Doctor Dashboard</h1>
        <p className="page-description">
          View healthcare records that patients have authorized you to access.
        </p>
      </div>

      {/* Wallet address */}
      <div className="info-bar" aria-label="Connected wallet information">
        <span className="info-label">Your Wallet Address</span>
        <span className="info-value" title={walletAddress}>{walletAddress || '—'}</span>
      </div>

      {/* Record lookup card */}
      <div className="card">
        <div className="card-header">
          <h2>Record Access Check</h2>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Enter a Record ID to verify whether you have been granted access by the patient.
          </p>

          <form onSubmit={handleCheckAccess}>
            <div className="lookup-section">
              <div className="form-group">
                <label className="form-label" htmlFor="record-id-input">Record ID</label>
                <input
                  id="record-id-input"
                  type="text"
                  className="form-control"
                  placeholder="e.g. rec_101"
                  value={recordId}
                  onChange={(e) => {
                    setRecordId(e.target.value);
                    if (accessResult !== null) resetCheck();
                  }}
                  disabled={checkLoading}
                  spellCheck="false"
                  autoComplete="off"
                />
              </div>
              <div style={{ paddingBottom: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={checkLoading}
                  id="check-access-btn"
                >
                  {checkLoading ? (
                    <>
                      <span className="spinner spinner-sm" aria-hidden="true" />
                      Checking...
                    </>
                  ) : (
                    'Check Record'
                  )}
                </button>
              </div>
            </div>
          </form>

          {checkError && (
            <div className="error-state" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {checkError}
            </div>
          )}

          {/* Access result display */}
          {accessResult !== null && !checkLoading && (
            <div
              className={`access-result ${
                accessResult.authorized ? 'access-result-granted' : 'access-result-denied'
              }`}
              role="status"
              aria-live="polite"
              id="access-result-panel"
            >
              {accessResult.authorized ? (
                <>
                  <div className="access-result-title">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Access Granted
                  </div>
                  <div className="access-result-desc">
                    You are authorized to view record{' '}
                    <strong style={{ fontFamily: 'Courier New, monospace' }}>{recordId.trim()}</strong>.
                  </div>

                  {/* View Record button — only shown when access is granted */}
                  {!recordData && (
                    <div style={{ marginTop: '14px' }}>
                      {viewLoading ? (
                        <LoadingState message="Loading record content..." />
                      ) : (
                        <>
                          {viewError && (
                            <div
                              className="error-state"
                              role="alert"
                              style={{ marginBottom: '10px' }}
                            >
                              {viewError}
                            </div>
                          )}
                          <button
                            className="btn btn-primary"
                            onClick={handleViewRecord}
                            id="view-record-btn"
                          >
                            View Record
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="access-result-title">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    Access Denied
                  </div>
                  <div className="access-result-desc">
                    Your access to record{' '}
                    <strong style={{ fontFamily: 'Courier New, monospace' }}>{recordId.trim()}</strong>{' '}
                    has been revoked or has not been granted.
                  </div>
                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-danger)',
                      opacity: 0.8,
                    }}
                  >
                    The patient controls access to this record through the blockchain smart contract.
                    Contact the patient to request access.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Record content viewer */}
          {recordData && (
            <div className="record-viewer" id="record-viewer" aria-label="Record content">
              <div className="record-viewer-header">
                <div>
                  <div className="record-label">{recordData.label}</div>
                  <div className="record-id">{recordData.recordId}</div>
                </div>
                <span className="badge badge-authorized">Authorized</span>
              </div>
              <div className="record-viewer-body">
                {isUrl(recordData.content) ? (
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                      This record is stored as an external file.
                    </p>
                    <a
                      href={recordData.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      id="open-record-link"
                    >
                      Open Record
                    </a>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 'var(--font-weight-semibold)',
                      }}
                    >
                      Record Content
                    </div>
                    <pre className="record-content-text">{recordData.content}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo instructions */}
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
          Demo Instructions
        </div>
        <ul
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            paddingLeft: '16px',
            lineHeight: '1.9',
            margin: 0,
          }}
        >
          <li>Enter <strong style={{ fontFamily: 'Courier New, monospace' }}>rec_101</strong> to check access to the Blood Test Report.</li>
          <li>If the patient has granted access, you will see <strong>Access Granted</strong>.</li>
          <li>Click <strong>View Record</strong> to read the record content.</li>
          <li>After the patient revokes access, the same ID will show <strong>Access Denied</strong>.</li>
        </ul>
      </div>
    </Layout>
  );
}
