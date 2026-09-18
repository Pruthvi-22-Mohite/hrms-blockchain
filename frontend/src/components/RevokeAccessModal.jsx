import { useState } from 'react';
import Modal from './Modal';
import { revokeAccess } from '../api/records';
import { useToast } from '../context/ToastContext';

/**
 * RevokeAccessModal - Confirmation modal for revoking a doctor's access.
 *
 * Props:
 *   record: { recordId, label }
 *   doctor: { walletAddress, name }
 *   onSuccess: function - Called after successful revoke
 */
export default function RevokeAccessModal({ record, doctor, onSuccess }) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revokeResult, setRevokeResult] = useState(null);

  function handleOpen() {
    setIsOpen(true);
    setError('');
    setRevokeResult(null);
  }

  function handleClose() {
    if (loading) return;
    setIsOpen(false);
  }

  async function handleRevoke() {
    setError('');
    setLoading(true);
    try {
      const result = await revokeAccess(record.recordId, doctor.walletAddress);
      setRevokeResult(result);
      showToast({
        type: 'info',
        title: 'Access revoked',
        message: `${doctor.name}'s access to "${record.label}" has been revoked.`,
      });
      onSuccess(doctor.walletAddress);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to revoke access. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-sm btn-danger-outline"
        onClick={handleOpen}
        id={`revoke-access-${record.recordId}-${doctor.walletAddress}`}
      >
        Revoke
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Revoke Access">
        {revokeResult ? (
          <div className="modal-body">
            <div
              style={{
                padding: '16px',
                background: 'var(--color-warning-bg)',
                border: '1px solid #e8c97a',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-warning)',
                  marginBottom: '8px',
                }}
              >
                Access revoked successfully
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)' }}>
                <strong>Transaction Hash:</strong>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    marginTop: '4px',
                    wordBreak: 'break-all',
                    background: 'rgba(255,255,255,0.5)',
                    padding: '4px 8px',
                    borderRadius: '3px',
                  }}
                >
                  {revokeResult.txHash}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            {error && (
              <div className="error-state" role="alert" style={{ marginBottom: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Doctor: <strong style={{ color: 'var(--color-text-primary)' }}>{doctor.name}</strong></div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Record: <strong style={{ color: 'var(--color-text-primary)' }}>{record.label}</strong></div>
            </div>

            <p className="confirm-text" style={{ fontSize: '1rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
              This doctor will no longer be able to retrieve this record.
            </p>
            <p
              className="confirm-text"
              style={{ marginTop: '8px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}
            >
              This revocation is submitted and confirmed on-chain. Future retrieval attempts will be denied.
            </p>

            <div
              style={{
                marginTop: '14px',
                padding: '10px 12px',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                Doctor Wallet
              </div>
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  wordBreak: 'break-all',
                }}
              >
                {doctor.walletAddress}
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          {revokeResult ? (
            <button className="btn btn-secondary" onClick={handleClose}>
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRevoke}
                disabled={loading}
                id={`revoke-confirm-${record.recordId}`}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm" aria-hidden="true" />
                    Revoking...
                  </>
                ) : (
                  'Revoke Access'
                )}
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
