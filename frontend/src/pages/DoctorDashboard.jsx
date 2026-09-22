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
      label: 'Records',
      active: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => {
        document.getElementById('record-id-input')?.focus();
      },
    },
    {
      label: 'Access Check',
      active: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: () => {
        document.getElementById('record-id-input')?.focus();
      },
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
        <div className="page-header-left">
          <h1>Doctor Dashboard</h1>
          <p className="page-description">
            Access healthcare records that patients have authorized you to view.
          </p>
        </div>
      </div>

      {/* Doctor Summary Metrics */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Accessible Records</span>
            <div className="summary-card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="summary-card-value">1</div>
          <div className="summary-card-sub">Granted for this session</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Current Session</span>
            <div className="summary-card-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M3 17a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="summary-card-value" style={{ fontSize: '1.4rem' }}>Doctor</div>
          <div className="summary-card-sub">Authorized medical practitioner</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Access Control</span>
            <div className="summary-card-icon" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 9V6a3 3 0 116 0v3" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            </div>
          </div>
          <div className="summary-card-value" style={{ fontSize: '1.3rem', color: 'var(--color-accent)' }}>
            Blockchain Verified
          </div>
          <div className="summary-card-sub">On-chain consent enforcement</div>
        </div>
      </div>

      {/* Wallet address */}
      <div className="info-bar" aria-label="Connected wallet information">
        <div className="info-bar-left">
          <span className="info-label">Doctor Wallet Address</span>
          <span className="info-value" title={walletAddress}>{walletAddress || '—'}</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Role: <strong style={{ color: 'var(--color-success)' }}>Doctor</strong>
        </div>
      </div>

      {/* Record lookup card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Check Record Access</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Enter a record ID to verify whether you are authorized to access it.
            </p>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleCheckAccess}>
            <div className="lookup-section">
              <div className="form-group">
                <label className="form-label" htmlFor="record-id-input">Record ID</label>
                <input
                  id="record-id-input"
                  type="text"
                  className="form-control"
                  placeholder="e.g. 1"
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
              <div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={checkLoading}
                  id="check-access-btn"
                >
                  {checkLoading ? (
                    <>
                      <span className="spinner spinner-sm" aria-hidden="true" />
                      Checking...
                    </>
                  ) : (
                    'Check Access'
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
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    ACCESS GRANTED
                  </div>
                  <div className="access-result-desc">
                    You are authorized to view this record (<strong style={{ fontFamily: 'Courier New, monospace' }}>{recordId.trim()}</strong>).
                  </div>

                  {/* View Record button — only shown when access is granted */}
                  {!recordData && (
                    <div style={{ marginTop: '18px' }}>
                      {viewLoading ? (
                        <LoadingState message="Retrieving record from IPFS..." />
                      ) : (
                        <>
                          {viewError && (
                            <div
                              className="error-state"
                              role="alert"
                              style={{ marginBottom: '12px' }}
                            >
                              {viewError}
                            </div>
                          )}
                          <button
                            className="btn btn-primary btn-lg"
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
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    ACCESS DENIED
                  </div>
                  <div className="access-result-desc">
                    You are not authorized to view this record.
                    Access may have been revoked by the patient or was never granted.
                  </div>
                  <div
                    style={{
                      marginTop: '12px',
                      fontSize: '0.8125rem',
                      color: 'var(--color-danger)',
                      opacity: 0.85,
                    }}
                  >
                    Consent permissions are verified against the Ethereum smart contract audit registry.
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetCheck}
                      id="check-again-btn"
                    >
                      Check Again
                    </button>
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
